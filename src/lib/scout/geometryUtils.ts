// Ported from legacy/fuzoapp/src/lib/geometryUtils.ts
// No logic changes

export interface LatLng {
  lat: number;
  lng: number;
}

export function getDistance(p1: LatLng, p2: LatLng): number {
  const R = 6378137;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLong = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const latToM = 111320;
  const lngToM = 111320 * Math.cos(p.lat * Math.PI / 180);

  const px = p.lng * lngToM;
  const py = p.lat * latToM;
  const ax = a.lng * lngToM;
  const ay = a.lat * latToM;
  const bx = b.lng * lngToM;
  const by = b.lat * latToM;

  const l2 = Math.pow(bx - ax, 2) + Math.pow(by - ay, 2);
  if (l2 === 0) return getDistance(p, a);

  let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * (bx - ax);
  const projY = ay + t * (by - ay);

  const dx = px - projX;
  const dy = py - projY;

  return Math.sqrt(dx * dx + dy * dy);
}

export function getDistanceToPolyline(point: LatLng, polyline: LatLng[]): number {
  if (!polyline || polyline.length === 0) return Infinity;
  if (polyline.length === 1) return getDistance(point, polyline[0]);

  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const dist = distanceToSegment(point, p1, p2);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}
