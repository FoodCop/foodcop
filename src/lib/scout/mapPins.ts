// Scout map pins in the "food app" style (client reference: Uber Eats pickup
// map): a white pill with a food icon, a count when several places sit close
// together, the lead place's name + "+N more" underneath, and an optional red
// tag on top for a real offer. Places that would overlap on screen at the
// current zoom are grouped into one pill; zooming in splits them apart.
//
// Markers are HTML elements drawn through a google.maps.OverlayView (not
// image icons), so they use the app's fonts/shadows and stay crisp.

import type { ScoutPlace } from '@/types/scout';

export type PinGroup = {
  key: string;
  lead: ScoutPlace;
  places: ScoutPlace[];
  lat: number;
  lng: number;
};

/** Metres per screen pixel at a zoom level and latitude (Web Mercator). */
function metersPerPixel(zoom: number, lat: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Greedy screen-space grouping: places are taken best-first (FUZO
 * restaurants, then rating x popularity) and each one either joins an
 * existing group whose lead is within `radiusPx` on screen, or starts its own.
 */
export function groupPlaces(
  places: ScoutPlace[],
  zoom: number,
  isFuzo: (p: ScoutPlace) => boolean,
  radiusPx = 54,
): PinGroup[] {
  if (places.length === 0) return [];
  const score = (p: ScoutPlace) => (isFuzo(p) ? 1e6 : 0) + (p.rating || 0) * Math.log10((p.reviews || 0) + 10);
  const ordered = [...places].sort((a, b) => score(b) - score(a));
  const groups: PinGroup[] = [];
  for (const p of ordered) {
    const radius = radiusPx * metersPerPixel(zoom, p.lat);
    const home = groups.find((g) => distanceMeters(g.lead, p) <= radius);
    if (home) home.places.push(p);
    else groups.push({ key: p.id, lead: p, places: [p], lat: p.lat, lng: p.lng });
  }
  return groups;
}

// ── Icons (lucide-style strokes, inline so markers need no React) ─────────
const SVG = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  food: SVG('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
  coffee: SVG('<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>'),
  cake: SVG('<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>'),
  bar: SVG('<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>'),
  star: '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
};

export function categoryIcon(place: ScoutPlace) {
  const c = `${place.cat} ${(place.vibe || []).join(' ')}`.toLowerCase();
  if (/caf[eé]|coffee|tea/.test(c)) return ICONS.coffee;
  if (/bak|dessert|cake|sweet|ice cream|patisserie/.test(c)) return ICONS.cake;
  if (/bar\b|pub|brew|wine|night/.test(c)) return ICONS.bar;
  return ICONS.food;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

/** Build the pin element for a group (single place or cluster). */
export function buildPinElement(group: PinGroup, opts: { isFuzo: boolean; tag?: string | null }): HTMLDivElement {
  const count = group.places.length;
  const el = document.createElement('div');
  el.className = `fz-mpin${opts.isFuzo ? ' is-fuzo' : ''}${count > 1 ? ' is-group' : ''}`;
  const name = esc(group.lead.name);
  const label =
    count > 1
      ? `<span class="fz-mpin__label">${name}<br/>+${count - 1} more</span>`
      : `<span class="fz-mpin__label">${name}</span>`;
  el.innerHTML = `
    ${opts.tag ? `<span class="fz-mpin__tag">${esc(opts.tag)}</span>` : ''}
    <button type="button" class="fz-mpin__pill" aria-label="${count > 1 ? `${count} places including ${name}` : name}">
      ${opts.isFuzo && count === 1 ? ICONS.star : ''}${count > 1 ? ICONS.food : categoryIcon(group.lead)}
      ${count > 1 ? `<b>${count}</b>` : ''}
    </button>
    ${label}`;
  return el;
}

type MapsNS = {
  OverlayView: new () => {
    setMap: (map: unknown) => void;
    getPanes: () => { overlayMouseTarget: HTMLElement } | null;
    getProjection: () => { fromLatLngToDivPixel: (ll: unknown) => { x: number; y: number } | null } | null;
  };
  LatLng: new (lat: number, lng: number) => unknown;
};

/**
 * Place an HTML element on the map at a lat/lng. Returns an object with
 * setMap(null) for cleanup, matching the google.maps.Marker API the rest of
 * Scout already uses for teardown.
 */
export function createHtmlMarker(
  maps: unknown,
  map: unknown,
  position: { lat: number; lng: number },
  element: HTMLElement,
  onClick: () => void,
  zIndex = 1,
): { setMap: (m: unknown) => void } {
  const ns = maps as MapsNS;
  element.style.position = 'absolute';
  element.style.zIndex = String(zIndex);
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  class HtmlMarker extends ns.OverlayView {
    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(element);
    }
    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(new ns.LatLng(position.lat, position.lng));
      if (!point) return;
      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
    }
    onRemove() {
      element.remove();
    }
  }

  const overlay = new HtmlMarker();
  overlay.setMap(map);
  return { setMap: (m: unknown) => overlay.setMap(m) };
}
