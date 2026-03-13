const AUTH_CALLBACK_PATH = '/auth/callback';

export const APP_PATH = '/app';
export const HOME_ENTRY_URL = '/?view=home';

const isDebugFlagTrue = (value: string | undefined) => value === '1' || value === 'true';

export const isAuthDebugEnabled = () => {
  const envEnabled = isDebugFlagTrue(import.meta.env.VITE_DEBUG_AUTH_FLOW);
  if (envEnabled) return true;

  const search = globalThis.location?.search ?? '';
  const debugInQuery = new URLSearchParams(search).get('debugAuth');
  if (isDebugFlagTrue(debugInQuery ?? undefined)) return true;

  try {
    const localValue = globalThis.localStorage?.getItem('fuzo:debug:auth-flow') ?? undefined;
    return isDebugFlagTrue(localValue);
  } catch {
    return false;
  }
};

export const authDebugLog = (event: string, details?: Record<string, unknown>) => {
  if (!isAuthDebugEnabled()) return;
  const timestamp = new Date().toISOString();
  console.log('[FUZO:AUTH_DEBUG]', timestamp, event, details ?? {});
};

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
    const localUrl = `${origin}${AUTH_CALLBACK_PATH}`;
    authDebugLog('oauth_redirect_url_local', { localUrl, origin, hostname });
    return localUrl;
  }

  const configuredAppUrl = normalizeAppUrl(import.meta.env.VITE_AUTH_REDIRECT_URL)
    || normalizeAppUrl(import.meta.env.VITE_APP_URL);

  const redirectUrl = configuredAppUrl ? `${configuredAppUrl}${AUTH_CALLBACK_PATH}` : `${origin}${AUTH_CALLBACK_PATH}`;
  authDebugLog('oauth_redirect_url_resolved', {
    redirectUrl,
    configuredAppUrl,
    origin,
    hostname,
    hasViteAuthRedirectUrl: Boolean(import.meta.env.VITE_AUTH_REDIRECT_URL),
    hasViteAppUrl: Boolean(import.meta.env.VITE_APP_URL),
  });
  return redirectUrl;
};
