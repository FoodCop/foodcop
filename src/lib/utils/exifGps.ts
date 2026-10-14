/**
 * Where a photo was taken, from its EXIF GPS tags (JPEG photos from phones).
 * Used by the Create flow to suggest the restaurant a gallery photo was taken
 * at (client, 2026-10-14: "AI should attempt to identify the location using
 * the image metadata"). Reads only the first 256 KB; returns null for photos
 * without GPS (screenshots, edited or shared images, PNG, HEIC...).
 *
 * The photo itself is re-encoded before upload (MediaUploadService.
 * uploadPostPhoto), so this location never goes public with the image.
 */

export interface GpsPoint {
  lat: number;
  lng: number;
}

const GPS_IFD_POINTER = 0x8825;

export async function readExifGps(file: Blob): Promise<GpsPoint | null> {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    return parseJpegGps(new DataView(buf));
  } catch {
    return null;
  }
}

export function parseJpegGps(view: DataView): GpsPoint | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) {
      return parseTiffGps(view, offset + 10);
    }
    if (marker === 0xda) return null; // image data starts: no EXIF before it
    offset += 2 + size;
  }
  return null;
}

function parseTiffGps(view: DataView, tiff: number): GpsPoint | null {
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  const u16 = (o: number) => view.getUint16(o, le);
  const u32 = (o: number) => view.getUint32(o, le);

  const ifd0 = tiff + u32(tiff + 4);
  const gpsOffset = findTag(view, ifd0, GPS_IFD_POINTER, u16, u32);
  if (gpsOffset == null) return null;
  const gpsIfd = tiff + gpsOffset;
  if (gpsIfd + 2 > view.byteLength) return null;

  let latRef = '', lngRef = '';
  let lat: number | null = null, lng: number | null = null;
  const count = u16(gpsIfd);
  for (let i = 0; i < count; i += 1) {
    const entry = gpsIfd + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = u16(entry);
    if (tag === 1 || tag === 3) {
      const ref = String.fromCharCode(view.getUint8(entry + 8));
      if (tag === 1) latRef = ref;
      else lngRef = ref;
    } else if (tag === 2 || tag === 4) {
      const valueOffset = tiff + u32(entry + 8);
      const dms = readRationals(view, valueOffset, 3, u32);
      if (!dms) continue;
      const deg = dms[0] + dms[1] / 60 + dms[2] / 3600;
      if (tag === 2) lat = deg;
      else lng = deg;
    }
  }
  if (lat == null || lng == null) return null;
  if (latRef === 'S') lat = -lat;
  if (lngRef === 'W') lng = -lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null; // "no fix" placeholder some cameras write
  return { lat, lng };
}

function findTag(view: DataView, ifd: number, tag: number, u16: (o: number) => number, u32: (o: number) => number): number | null {
  if (ifd + 2 > view.byteLength) return null;
  const count = u16(ifd);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) return null;
    if (u16(entry) === tag) return u32(entry + 8);
  }
  return null;
}

function readRationals(view: DataView, offset: number, n: number, u32: (o: number) => number): number[] | null {
  if (offset + n * 8 > view.byteLength) return null;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const num = u32(offset + i * 8);
    const den = u32(offset + i * 8 + 4);
    out.push(den ? num / den : 0);
  }
  return out;
}
