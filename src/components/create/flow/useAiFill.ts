'use client';

import { useEffect, useRef, useState } from 'react';
import { aiAvailable, aiFill, imageFrame, videoFrames, type AiFill, type AiTask } from '@/lib/ai/aiFillClient';
import { PlacesService } from '@/lib/services/placesService';
import { RestaurantService } from '@/lib/services/restaurantService';
import type { PostPlace } from '@/lib/services/postService';
import type { TourStop } from '@/lib/types/foodCard';
import type { PostFields } from './types';

// Runs FUZO AI once per video (or import) when its details screen opens, and
// fills only the fields that are still empty. Undo puts back what was there.
// If AI is off (no credit) it does nothing and the form stays manual.

export type AiFillState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done'; filled: string[] }
  | { status: 'off' }
  | { status: 'error'; message: string };

interface Options {
  /** Run now (details step open, not editing an old post). */
  enabled: boolean;
  /** Changes for each new video / import + kind (each runs once). */
  runKey: string | null;
  task: AiTask | null;
  /** A clip to take frames from (recording, gallery clip). */
  videoUrl?: string | null;
  videoDuration?: number;
  /** An image to look at instead (an import's cover / photo). */
  image?: Blob | null;
  /** Text to read (an import's title and caption). */
  text?: string;
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

const getPosition = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 6000, maximumAge: 300_000 },
    );
  });

/** The best real place for a name the AI read (sign, menu, caption). */
async function findPlace(name: string, near: { lat: number; lng: number } | null): Promise<PostPlace | null> {
  if (!name.trim()) return null;
  const res = await PlacesService.searchByText(name, near?.lat ?? 0, near?.lng ?? 0, near ? 30000 : 50000);
  const r = res.data?.results?.[0];
  const lat = r?.geometry?.location?.lat;
  const lng = r?.geometry?.location?.lng;
  if (!r || typeof lat !== 'number' || typeof lng !== 'number') return null;
  const place: PostPlace = { placeId: r.place_id ?? null, name: r.name, address: r.formatted_address || r.vicinity || null, lat, lng };
  if (place.placeId) {
    const link = await RestaurantService.findByPlaceIds([place.placeId]);
    const fuzo = link.success ? link.data?.get(place.placeId) : undefined;
    if (fuzo) return { ...place, restaurantId: fuzo.restaurantId, name: fuzo.name || place.name };
  }
  return place;
}

/** What to fill from the AI's answer - only fields that are empty now. */
async function buildPatch(task: AiTask, fill: AiFill, f: PostFields): Promise<{ patch: Partial<PostFields>; filled: string[] }> {
  const patch: Partial<PostFields> = {};
  const filled: string[] = [];
  const tags = { ...f.tags };
  let tagsChanged = false;
  const fillTag = (key: 'cuisine' | 'meal_type' | 'diet' | 'cooking_style', values: string[], label: string) => {
    if (!tags[key].length && values.length) {
      tags[key] = values;
      tagsChanged = true;
      filled.push(label);
    }
  };
  fillTag('cuisine', fill.cuisine, 'cuisine');
  fillTag('meal_type', fill.mealType, 'meal type');
  fillTag('diet', fill.diet, 'dietary');
  fillTag('cooking_style', fill.cookingStyle, 'cooking style');
  if (tagsChanged) patch.tags = tags;

  if (task === 'recipe' && fill.recipe) {
    if (!f.title.trim() && fill.recipe.name) {
      patch.title = fill.recipe.name;
      filled.unshift('dish name');
    }
    if (!f.ingredients.some((r) => r[0]?.trim()) && fill.recipe.ingredients.length) {
      patch.ingredients = fill.recipe.ingredients.map((i) => [i.name, i.quantity, i.unit] as [string, string, string]);
      filled.push('ingredients');
    }
    if (!f.steps.some((s) => s.trim()) && fill.recipe.steps.length) {
      patch.steps = fill.recipe.steps;
      filled.push('steps');
    }
  }

  if (task === 'review' && fill.review) {
    if (!f.title.trim() && fill.review.foodName) {
      patch.title = fill.review.foodName;
      filled.unshift('food name');
    }
    if (!f.place && fill.review.placeName) {
      const here = await getPosition();
      const place = await findPlace([fill.review.placeName, fill.review.placeClue].filter(Boolean).join(' '), here);
      if (place) {
        patch.place = place;
        patch.menuItemId = null;
        filled.unshift('place');
      }
    }
  }

  if (task === 'tour' && fill.tour) {
    if (!f.title.trim() && fill.tour.title) patch.title = fill.tour.title;
    if (!f.stops.length && fill.tour.stops.length) {
      let near = await getPosition();
      const stops: TourStop[] = [];
      for (const s of fill.tour.stops.slice(0, 10)) {
        const place = s.placeName ? await findPlace(s.placeName, near) : null;
        if (!place || stops.some((x) => x.placeId && x.placeId === place.placeId)) continue;
        stops.push({ name: place.name || s.placeName, address: place.address ?? null, lat: place.lat, lng: place.lng, placeId: place.placeId ?? null, restaurantId: place.restaurantId ?? null, communityPlaceId: null, dish: s.dish || null });
        near = { lat: place.lat, lng: place.lng };
      }
      if (stops.length) {
        patch.stops = stops;
        filled.unshift(`${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}`);
      }
    }
  }
  return { patch, filled };
}

export function useAiFill(o: Options) {
  const [state, setState] = useState<AiFillState>({ status: 'idle' });
  const before = useRef<Partial<PostFields> | null>(null);
  const tried = useRef(new Set<string>());
  const latest = useRef(o);
  useEffect(() => {
    latest.current = o;
  });

  useEffect(() => {
    const { enabled, runKey, task } = o;
    if (!enabled || !runKey || !task || tried.current.has(runKey)) return;
    tried.current.add(runKey);
    let cancelled = false;
    (async () => {
      if (!(await aiAvailable())) {
        if (!cancelled) setState({ status: 'off' });
        return;
      }
      if (cancelled) return;
      setState({ status: 'working' });
      const cur = latest.current;
      let frames: string[] = [];
      try {
        if (cur.videoUrl) frames = await videoFrames(cur.videoUrl, cur.videoDuration ?? 0);
        else if (cur.image) {
          const one = await imageFrame(cur.image);
          if (one) frames = [one];
        }
      } catch {
        frames = [];
      }
      if (!frames.length && !cur.text?.trim()) {
        if (!cancelled) setState({ status: 'error', message: "FUZO AI couldn't look at this one - fill it in yourself." });
        return;
      }
      const res = await aiFill(task, { frames, text: cur.text });
      if (cancelled) return;
      if (!res.ok) {
        setState(res.off ? { status: 'off' } : { status: 'error', message: res.message });
        return;
      }
      // Fill what's still empty now (the user may have typed meanwhile).
      const now = latest.current.fields;
      const { patch, filled } = await buildPatch(task, res.fill, now);
      if (cancelled) return;
      if (!filled.length) {
        setState({ status: 'error', message: "FUZO AI didn't find anything to add - fill it in yourself." });
        return;
      }
      before.current = Object.fromEntries(Object.keys(patch).map((k) => [k, now[k as keyof PostFields]])) as Partial<PostFields>;
      latest.current.onChange(patch);
      setState({ status: 'done', filled });
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per runKey; the rest is read from `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.enabled, o.runKey, o.task]);

  const undo = () => {
    if (before.current) latest.current.onChange(before.current);
    before.current = null;
    setState({ status: 'idle' });
  };

  return { state, undo };
}
