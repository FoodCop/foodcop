'use client';

import { MapPinOff } from 'lucide-react';

// Covers a map when Google refuses to load it (hides Google's "Oops" message).
// The parent must be positioned. Below it, FUZO's own places keep working.
export function MapUnavailable({ hint = 'Everything else in FUZO still works.' }: { hint?: string }) {
  return (
    <div className="fz-map-off" role="status">
      <span className="fz-map-off__icon" aria-hidden="true">
        <MapPinOff size={24} />
      </span>
      <strong>Map temporarily unavailable</strong>
      <span>{hint}</span>
    </div>
  );
}
