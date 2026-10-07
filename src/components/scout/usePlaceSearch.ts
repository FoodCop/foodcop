'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { extractSuggestionText } from '@/lib/scout/scoutLogic';

export type PlaceSuggestion = { text: string; placeId: string };

type PlacesLib = {
  AutocompleteSuggestion?: {
    fetchAutocompleteSuggestions: (req: { input: string; locationBias?: unknown }) => Promise<{ suggestions?: unknown[] }>;
  };
};
type MapsWithImport = { importLibrary?: (name: string) => Promise<unknown> };

/**
 * Google place autocomplete for a text field (Directions' From / To), debounced
 * 300ms. `bias` nudges results toward where the user is.
 */
export function usePlaceSearch(bias?: { lat: number; lng: number } | null) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);

  const search = useCallback(
    (input: string) => {
      window.clearTimeout(timer.current);
      const text = input.trim();
      if (text.length < 2) {
        seq.current += 1;
        setSuggestions([]);
        return;
      }
      timer.current = window.setTimeout(async () => {
        const id = ++seq.current;
        const maps = (window as unknown as { google?: { maps?: MapsWithImport } }).google?.maps;
        if (!maps?.importLibrary) return;
        try {
          const lib = (await maps.importLibrary('places')) as PlacesLib;
          const res = await lib.AutocompleteSuggestion?.fetchAutocompleteSuggestions({
            input: text,
            ...(bias ? { locationBias: { center: bias, radius: 30000 } } : {}),
          });
          if (id !== seq.current) return; // a newer keystroke won
          setSuggestions(
            (res?.suggestions ?? []).map(extractSuggestionText).filter((s): s is PlaceSuggestion => !!s && !!s.text),
          );
        } catch (err) {
          console.error('Place search failed:', err);
        }
      }, 300);
    },
    [bias],
  );

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    seq.current += 1;
    setSuggestions([]);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { suggestions, search, clear };
}
