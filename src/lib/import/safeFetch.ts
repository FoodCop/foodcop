// Server only: imported by src/app/api/import/route.ts.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Fetching a link someone pasted (URL import, client 2026-10-16) - on the
// server, so it must never become a way into private networks (SSRF):
// - https only, standard port, no user:password@;
// - every address the host resolves to must be public (no loopback, private,
//   link-local / cloud metadata, carrier-grade NAT, multicast...), checked
//   again on every redirect (max 4, followed by hand);
// - 8 s time limit, size limit, and only the content types asked for.

export class FetchBlockedError extends Error {}

const v4ToInt = (ip: string) => ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
const inV4 = (ip: string, cidr: string) => {
  const [base, bits] = cidr.split('/');
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (v4ToInt(ip) & mask) === (v4ToInt(base) & mask);
};
const PRIVATE_V4 = [
  '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24',
  '192.88.99.0/24', '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
];

/** true for any address that isn't on the public internet. */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return PRIVATE_V4.some((c) => inV4(ip, c));
  if (kind === 6) {
    const a = ip.toLowerCase();
    if (a === '::' || a === '::1') return true;
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    if (/^::ffff:/.test(a) || /^64:ff9b:/.test(a)) return true; // other IPv4-mapped / translated forms: refuse
    const first = parseInt(a.split(':')[0] || '0', 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (first === 0x2001 && parseInt(a.split(':')[1] || '0', 16) === 0x0db8) return true; // documentation
    return false;
  }
  return true; // not an IP at all
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new FetchBlockedError('Not a valid link.');
  }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new FetchBlockedError('Only normal https links can be imported.');
  const hostname = u.hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new FetchBlockedError('That address cannot be imported.');
    return u;
  }
  if (!hostname.includes('.') || /\.(local|internal|localhost|lan|home|corp)$/i.test(hostname) || /^localhost$/i.test(hostname)) {
    throw new FetchBlockedError('That address cannot be imported.');
  }
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new FetchBlockedError("We couldn't reach that website.");
  }
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new FetchBlockedError('That address cannot be imported.');
  return u;
}

export interface SafeResponse {
  url: string;
  contentType: string;
  body: Buffer;
}

/** GETs a public https URL with the protections above. Accepts the given content types (prefix match). */
export async function safeFetch(
  raw: string,
  opts: { accept: string[]; maxBytes: number; headers?: Record<string, string>; timeoutMs?: number },
): Promise<SafeResponse> {
  const deadline = AbortSignal.timeout(opts.timeoutMs ?? 8000);
  let current = raw;
  for (let hop = 0; hop <= 4; hop += 1) {
    const u = await assertPublicUrl(current);
    const res = await fetch(u, { redirect: 'manual', signal: deadline, headers: { 'accept-language': 'en', ...opts.headers } }).catch((err) => {
      throw new FetchBlockedError(err?.name === 'TimeoutError' ? 'That website took too long to answer.' : "We couldn't reach that website.");
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) throw new FetchBlockedError("We couldn't open that link.");
      current = new URL(next, u).href;
      continue;
    }
    if (!res.ok) throw new FetchBlockedError(res.status === 404 ? "That post wasn't found - check the link." : "That website didn't share the post.");
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!opts.accept.some((t) => contentType.startsWith(t))) throw new FetchBlockedError("That link isn't a page we can read.");
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > opts.maxBytes) throw new FetchBlockedError('That page is too big to import.');
    // Read at most maxBytes.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > opts.maxBytes) {
          await reader.cancel().catch(() => {});
          throw new FetchBlockedError('That page is too big to import.');
        }
        chunks.push(value);
      }
    }
    return { url: u.href, contentType, body: Buffer.concat(chunks) };
  }
  throw new FetchBlockedError('That link redirects too many times.');
}
