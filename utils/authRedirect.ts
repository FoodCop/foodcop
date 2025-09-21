/**
 * Centralized redirect logic for authentication flows
 * Prevents redirect loops and ensures consistent behavior
 */

export interface RedirectConfig {
  hostname: string;
  isDevelopment: boolean;
  defaultRedirect: string;
}

/**
 * Get the appropriate redirect URL based on environment and hostname
 */
export function getRedirectUrl(config: RedirectConfig): string {
  const { hostname, isDevelopment, defaultRedirect } = config;

  // In development, always use localhost
  if (isDevelopment) {
    return `${window.location.origin}/auth/callback`;
  }

  // In production, use the configured hostname
  return `${window.location.protocol}//${hostname}/auth/callback`;
}

/**
 * Get the redirect URL for OAuth flows
 */
export function getOAuthRedirectUrl(): string {
  const isDevelopment = import.meta.env.DEV;
  const hostname = window.location.hostname;

  return getRedirectUrl({
    hostname,
    isDevelopment,
    defaultRedirect: "/auth/callback",
  });
}

/**
 * Clean up URL parameters after OAuth callback and replace pathname
 */
export function cleanupOAuthCallback(): void {
  const url = new URL(window.location.href);

  // Remove OAuth-related parameters
  const paramsToRemove = [
    "code",
    "state",
    "error",
    "error_description",
    "onboarding",
  ];

  paramsToRemove.forEach((param) => {
    url.searchParams.delete(param);
  });

  // Replace the pathname to prevent re-triggering the callback
  url.pathname = "/";

  // Update the URL without triggering a page reload
  window.history.replaceState({}, document.title, url.toString());
}

/**
 * Check if current URL is an OAuth callback
 */
export function isOAuthCallback(): boolean {
  const url = new URL(window.location.href);
  return (
    url.pathname === "/auth/callback" ||
    url.searchParams.has("code") ||
    url.searchParams.has("error")
  );
}

/**
 * Get the intended destination after successful auth
 */
export function getPostAuthDestination(): string {
  const url = new URL(window.location.href);
  const intended = url.searchParams.get("redirect_to");

  // Default to onboarding for new users, feed for existing users
  return intended || "/onboarding";
}
