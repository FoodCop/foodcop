/**
 * A same-site path to continue to after sign-in (?next=...), or null.
 * Only plain relative paths are accepted - never "//host" or "/\host",
 * which browsers treat as another site (open-redirect protection).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2048) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (raw.startsWith('/login') || raw.startsWith('/auth/')) return null;
  return raw;
}
