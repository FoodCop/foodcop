// Domain canonicalization utility
// Prevents session confusion between www.fuzo.app and fuzo.app

export function shouldCanonicalizeToWww(): boolean {
  // Only canonicalize in production (not localhost or Figma preview)
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Don't canonicalize localhost or Figma preview
  if (hostname === 'localhost' || hostname.endsWith('.figma.site')) {
    return false;
  }
  
  // Canonicalize apex domain to www in production
  return hostname === 'fuzo.app';
}

export function canonicalizeToWww(): void {
  if (!shouldCanonicalizeToWww()) return;
  
  console.log('🔄 Canonicalizing fuzo.app → www.fuzo.app to prevent session confusion');
  
  const newUrl = window.location.href.replace('://fuzo.app', '://www.fuzo.app');
  window.location.replace(newUrl);
}

export function initializeDomainCanonicalizer(): void {
  // Run canonicalization check on app load
  if (typeof window !== 'undefined') {
    // Small delay to ensure app is initialized
    setTimeout(() => {
      canonicalizeToWww();
    }, 100);
  }
}