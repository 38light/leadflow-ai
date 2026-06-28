import { describe, it, expect } from "vitest";
import {
  assertSafeWebhookUrl,
  isPrivateOrReservedIp,
  WebhookUrlError,
  type LookupFn,
} from "./ssrf-guard";

// Hermetic DNS: map hostnames → fixed addresses, no real network I/O.
function fakeLookup(map: Record<string, string[]>): LookupFn {
  return async (hostname: string) => {
    const addrs = map[hostname];
    if (!addrs) throw new Error(`ENOTFOUND ${hostname}`);
    return addrs.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    }));
  };
}

describe("isPrivateOrReservedIp", () => {
  it("flags private / loopback / link-local / reserved addresses", () => {
    const blocked = [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "0.0.0.0",
      "100.64.0.1", // CGNAT
      "255.255.255.255",
      "::1",
      "::",
      "fc00::1",
      "fd12:3456::1",
      "fe80::1",
      "::ffff:10.0.0.1", // IPv4-mapped private
    ];
    for (const ip of blocked) {
      expect(isPrivateOrReservedIp(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    const allowed = [
      "93.184.216.34",
      "1.1.1.1",
      "8.8.8.8",
      "2606:2800:220:1:248:1893:25c8:1946",
    ];
    for (const ip of allowed) {
      expect(isPrivateOrReservedIp(ip), ip).toBe(false);
    }
  });

  it("blocks un-parseable input (fails closed)", () => {
    expect(isPrivateOrReservedIp("not-an-ip")).toBe(true);
  });
});

describe("assertSafeWebhookUrl", () => {
  it("rejects the cloud metadata IP (169.254.169.254)", async () => {
    await expect(
      assertSafeWebhookUrl("https://169.254.169.254/latest/meta-data/")
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("rejects localhost (resolves to loopback)", async () => {
    const lookup = fakeLookup({ localhost: ["127.0.0.1"] });
    await expect(
      assertSafeWebhookUrl("https://localhost:8080/hook", { lookup })
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("rejects a 10.x internal host literal", async () => {
    await expect(
      assertSafeWebhookUrl("https://10.1.2.3/internal")
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("rejects non-https URLs", async () => {
    await expect(
      assertSafeWebhookUrl("http://example.com/")
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("rejects URLs with embedded credentials", async () => {
    const lookup = fakeLookup({ "example.com": ["93.184.216.34"] });
    await expect(
      assertSafeWebhookUrl("https://user:pass@example.com/", { lookup })
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("rejects a public host that resolves to a private IP (DNS rebinding)", async () => {
    const lookup = fakeLookup({ "evil.example.com": ["93.184.216.34", "10.0.0.7"] });
    await expect(
      assertSafeWebhookUrl("https://evil.example.com/", { lookup })
    ).rejects.toBeInstanceOf(WebhookUrlError);
  });

  it("allows a normal public https URL", async () => {
    const lookup = fakeLookup({ "example.com": ["93.184.216.34"] });
    const url = await assertSafeWebhookUrl(
      "https://example.com/webhooks/leadflow",
      { lookup }
    );
    expect(url.hostname).toBe("example.com");
  });

  it("enforces the egress allowlist when set", async () => {
    const lookup = fakeLookup({
      "allowed.example.com": ["93.184.216.34"],
      "blocked.example.com": ["93.184.216.34"],
    });
    const prev = process.env.WEBHOOK_EGRESS_ALLOWLIST;
    process.env.WEBHOOK_EGRESS_ALLOWLIST = "allowed.example.com";
    try {
      await expect(
        assertSafeWebhookUrl("https://allowed.example.com/", { lookup })
      ).resolves.toBeInstanceOf(URL);
      await expect(
        assertSafeWebhookUrl("https://blocked.example.com/", { lookup })
      ).rejects.toBeInstanceOf(WebhookUrlError);
    } finally {
      process.env.WEBHOOK_EGRESS_ALLOWLIST = prev;
    }
  });
});
