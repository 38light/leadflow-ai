import dns from "dns/promises";
import net from "net";

/**
 * SSRF guard for server-side fetches of user-supplied URLs (e.g. outbound webhooks).
 *
 * Rejects non-https, non-standard ports, and any host that resolves to a
 * private / loopback / link-local / CGNAT / reserved / cloud-metadata address.
 * DNS is resolved so a public-looking hostname that points at an internal IP
 * (or a DNS-rebind) is still caught.
 *
 * Throws an Error if the URL is not safe to fetch. Callers should treat a throw
 * as "do not fetch".
 */
export async function assertSafeFetchUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("URL must use https://");
  }

  // Only the default https port (empty) or an explicit 443.
  if (url.port && url.port !== "443") {
    throw new Error("URL port is not allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  let ips: string[];
  if (net.isIP(host)) {
    ips = [host];
  } else {
    let records: { address: string }[];
    try {
      records = await dns.lookup(host, { all: true });
    } catch {
      throw new Error("Could not resolve host");
    }
    if (!records.length) throw new Error("Host did not resolve");
    ips = records.map((r) => r.address);
  }

  for (const ip of ips) {
    if (isBlockedIp(ip)) {
      throw new Error("URL resolves to a disallowed (private/reserved) address");
    }
  }
}

function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isBlockedIpv4(ip);
  if (v === 6) return isBlockedIpv6(ip);
  return true; // unparseable → block
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10/8 private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 private
  if (a === 192 && b === 168) return true; // 192.168/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("ff")) return true; // multicast
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}
