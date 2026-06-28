import { lookup as dnsLookup } from "dns/promises";
import net from "net";

/**
 * Thrown when a webhook URL is rejected by the SSRF guard. Callers map this to
 * a 400 response. The message is always safe to surface to the tenant — it
 * never leaks the resolved internal IP.
 */
export class WebhookUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookUrlError";
  }
}

/** Injectable DNS resolver so callers (and tests) can avoid real network I/O. */
export type LookupFn = (
  hostname: string
) => Promise<{ address: string; family: number }[]>;

const defaultLookup: LookupFn = (hostname) => dnsLookup(hostname, { all: true });

/* ------------------------------------------------------------------ */
/*  IPv4 classification                                               */
/* ------------------------------------------------------------------ */

// Private, loopback, link-local, and otherwise non-public IPv4 ranges.
const BLOCKED_V4_CIDRS: [string, number][] = [
  ["0.0.0.0", 8], // "this host" / unspecified
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. 169.254.169.254 cloud metadata)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved (incl. 255.255.255.255 broadcast)
];

function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let long = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    long = long * 256 + n;
  }
  return long >>> 0;
}

function inCidrV4(ip: string, base: string, bits: number): boolean {
  const ipLong = ipv4ToLong(ip);
  const baseLong = ipv4ToLong(base);
  if (ipLong === null || baseLong === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipLong & mask) === (baseLong & mask);
}

/* ------------------------------------------------------------------ */
/*  IPv6 classification                                               */
/* ------------------------------------------------------------------ */

/** Expand an IPv6 string (incl. `::` and embedded IPv4) to 8 16-bit groups. */
function expandIpv6(ip: string): number[] | null {
  let addr = ip.toLowerCase().split("%")[0]; // strip zone id

  // Embedded IPv4 tail, e.g. ::ffff:1.2.3.4
  const v4Match = addr.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) {
    const v4 = ipv4ToLong(v4Match[2]);
    if (v4 === null) return null;
    const hi = (v4 >>> 16) & 0xffff;
    const lo = v4 & 0xffff;
    addr = `${v4Match[1]}${hi.toString(16)}:${lo.toString(16)}`;
  }

  const halves = addr.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];

  let groups: string[];
  if (halves.length === 1) {
    if (head.length !== 8) return null; // no "::" → must be fully specified
    groups = head;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  }

  if (groups.length !== 8) return null;

  const out: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g || "0") && g !== "") return null;
    const n = parseInt(g || "0", 16);
    if (Number.isNaN(n)) return null;
    out.push(n);
  }
  return out;
}

function isBlockedIpv6(ip: string): boolean {
  const groups = expandIpv6(ip);
  if (!groups) return true; // un-parseable → safe default: block

  // IPv4-mapped (::ffff:a.b.c.d) → reclassify the embedded IPv4.
  if (
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff
  ) {
    const a = (groups[6] >> 8) & 0xff;
    const b = groups[6] & 0xff;
    const c = (groups[7] >> 8) & 0xff;
    const d = groups[7] & 0xff;
    return isPrivateOrReservedIp(`${a}.${b}.${c}.${d}`);
  }

  const allZero = groups.every((g) => g === 0);
  if (allZero) return true; // :: unspecified
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true; // ::1 loopback
  if ((groups[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((groups[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast

  return false;
}

/* ------------------------------------------------------------------ */
/*  Public classifier                                                 */
/* ------------------------------------------------------------------ */

/**
 * True when `ip` (a literal IPv4/IPv6 address) is private, loopback,
 * link-local, multicast, or otherwise non-routable on the public internet.
 * Un-classifiable input returns true (fail closed). No network I/O.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    return BLOCKED_V4_CIDRS.some(([base, bits]) => inCidrV4(ip, base, bits));
  }
  if (family === 6) {
    return isBlockedIpv6(ip);
  }
  return true; // not a valid IP literal → cannot vouch for it
}

/* ------------------------------------------------------------------ */
/*  URL guard                                                         */
/* ------------------------------------------------------------------ */

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Validate an outbound webhook URL against SSRF. Requires https, forbids
 * embedded credentials, resolves the hostname via DNS, and rejects the URL if
 * *any* resolved address is private/reserved. Optionally enforces an env
 * allowlist (`WEBHOOK_EGRESS_ALLOWLIST`).
 *
 * Call this at creation time AND immediately before each delivery — a hostname
 * can re-resolve to a private IP later (DNS rebinding).
 *
 * @throws {WebhookUrlError} with a tenant-safe message on any violation.
 * @returns the parsed URL when safe.
 */
export async function assertSafeWebhookUrl(
  rawUrl: string,
  options: { lookup?: LookupFn } = {}
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new WebhookUrlError("Webhook URL is not a valid URL.");
  }

  if (url.protocol !== "https:") {
    throw new WebhookUrlError("Webhook URL must use https.");
  }
  if (url.username || url.password) {
    throw new WebhookUrlError("Webhook URL must not contain credentials.");
  }

  const hostname = url.hostname.replace(/^\[/, "").replace(/\]$/, ""); // unwrap [ipv6]

  const allowlist = parseAllowlist(process.env.WEBHOOK_EGRESS_ALLOWLIST);
  if (allowlist.length > 0 && !allowlist.includes(hostname.toLowerCase())) {
    throw new WebhookUrlError("Webhook host is not in the egress allowlist.");
  }

  // Host is already an IP literal → classify directly, no DNS needed.
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new WebhookUrlError("Webhook URL resolves to a disallowed address.");
    }
    return url;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await (options.lookup ?? defaultLookup)(hostname);
  } catch {
    throw new WebhookUrlError("Webhook host could not be resolved.");
  }

  if (!addresses || addresses.length === 0) {
    throw new WebhookUrlError("Webhook host could not be resolved.");
  }

  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new WebhookUrlError("Webhook URL resolves to a disallowed address.");
    }
  }

  return url;
}
