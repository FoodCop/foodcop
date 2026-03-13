const AUTH_CALLBACK_PATH = '/auth/callback';

export const APP_PATH = '/app';
export const HOME_ENTRY_URL = '/app?view=feed';

export const isAppPath = (pathname: string) => pathname === APP_PATH || pathname.startsWith(`${APP_PATH}/`);

export const isAuthCallbackPath = (pathname: string) => (
  pathname === AUTH_CALLBACK_PATH || pathname.startsWith(`${AUTH_CALLBACK_PATH}/`)
);

const normalizeAppUrl = (value: string | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  const unquoted = (trimmed.startsWith('"') || trimmed.startsWith("'")) ? trimmed.slice(1) : trimmed;
  const clean = (unquoted.endsWith('"') || unquoted.endsWith("'")) ? unquoted.slice(0, -1) : unquoted;
  try {
    const parsed = new URL(clean);
    return parsed.origin;
  } catch {
    return clean.replace(/\/+$/, '');
  }
};

export const getOAuthRedirectUrl = () => {
  const { origin, hostname } = globalThis.location;
  const isLocalDevHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  if (isLocalDevHost) {
    return `${origin}${AUTH_CALLBACK_PATH}`;
  }

  const configuredAppUrl = normalizeAppUrl(import.meta.env.VITE_AUTH_REDIRECT_URL)
    || normalizeAppUrl(import.meta.env.VITE_APP_URL);

  return configuredAppUrl ? `${configuredAppUrl}${AUTH_CALLBACK_PATH}` : `${origin}${AUTH_CALLBACK_PATH}`;
};
