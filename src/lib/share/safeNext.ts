/**
 * A same-site path to continue to after sign-in (?next=...), or null.
 * Only plain relative paths are accepted - never "//host" or "/\host",
 * which browsers treat as another site (open-redirect protection). Tabs,
 * newlines and backslashes are rejected too: browsers strip or rewrite them,
 * so "/\t/evil.com" would become "//evil.com". The result is also re-parsed
 * to be sure it stays on this site.
 */
const PROBE_ORIGIN = 'https://fuzo.invalid';
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u001F\u007F\\]/;

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2048) return null;
  if (UNSAFE_CHARS.test(raw)) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;
  const path = `${url.pathname}${url.search}${url.hash}`;
  if (path.startsWith('/login') || path.startsWith('/auth/')) return null;
  return path;
}
