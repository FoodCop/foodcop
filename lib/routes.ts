import { NextRequest } from "next/server";
type LatLng = { lat: number; lng: number };
export async function fetchDirections(
  origin: LatLng,
  destination: LatLng,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { ok: false, reason: "Missing GOOGLE_MAPS_API_KEY" };
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  );
  if (!res.ok) return { ok: false, reason: "Directions fetch failed" };
  const json = await res.json();
  const route = json.routes?.[0];
  return {
    ok: true,
    polyline: route?.overview_polyline?.points ?? null,
    summary: route?.summary ?? "",
  };
}
export async function readJsonBody<T>(req: NextRequest): Promise<T> {
  return (await req.json()) as T;
}
