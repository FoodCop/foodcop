/**
 * THEME (client, 2026-10-06): Light / Dark / System, chosen in Profile ->
 * Settings -> Appearance and kept in localStorage. The resolved theme is
 * html[data-theme] ('light' | 'dark'); _header.scss holds the dark styles.
 *
 * THEME_SCRIPT runs inline in <head> (app/layout.tsx) before first paint, so
 * a dark-mode user never sees a light flash, and it keeps following the OS
 * while the choice is "system".
 */

export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'fz-theme';
const CHANGE_EVENT = 'fz-theme-change';

export const THEME_SCRIPT = `(function(){try{var k='${THEME_KEY}',m=window.matchMedia('(prefers-color-scheme: dark)');function a(){var p=localStorage.getItem(k);var d=p==='dark'||(p==='system'&&m.matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}a();m.addEventListener('change',a);}catch(e){}})();`;

function isPref(value: string | null): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getThemePref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isPref(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function applyThemePref(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Private mode etc.: still switch for this visit.
  }
  applyThemePref(pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore: re-read when the choice changes (this tab or another). */
export function subscribeThemePref(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    applyThemePref(getThemePref());
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
