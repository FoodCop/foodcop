import type { TakoGroup } from '@/types/tako';

// Opens the Tako assistant (mounted once in SiteHeader) from anywhere, e.g.
// the Tako page's shortcuts: straight into a chat, or with a group open.

export const TAKO_OPEN_EVENT = 'fz-tako-open';

export type TakoStart = { prompt?: string; group?: TakoGroup['id'] };

export const openTako = (start: TakoStart = {}) => {
  window.dispatchEvent(new CustomEvent<TakoStart>(TAKO_OPEN_EVENT, { detail: start }));
};

/**
 * The client's Tako mascot art (a squirrel, client 2026-11-04): the full
 * squirrel for big spots (the Tako landing, animated by TakoSquirrel) and the
 * round face for small ones (the dock button, the chat header, Tako's answer
 * cards). Set to null to bring back the animated octopus (TakoMascot).
 */
export const TAKO_ART: { body: string; face: string } | null = {
  body: '/images/tako/squirrel.webp',
  face: '/images/tako/squirrel-face.webp',
};
