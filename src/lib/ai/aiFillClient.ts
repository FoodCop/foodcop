// FUZO AI in Create (client, 2026-10-16; docs/VIDEO_URL_PLAN.md, phase 7):
// a few small frames from the video (and an imported post's caption) go to
// POST /api/ai/fill; the answer is suggestions for empty fields. When the AI
// account has no credit the server says so ({ off }) and the app carries on
// by hand - it switches itself on again once credit is added.

import type { AiFill } from '@/app/api/ai/fill/route';

export type AiTask = 'recipe' | 'review' | 'tour';
export type { AiFill };

let statusCache: { at: number; available: boolean } | null = null;

/** Whether FUZO AI is on (cached for a minute; asks the server, which makes no AI call). */
export async function aiAvailable(): Promise<boolean> {
  if (statusCache && Date.now() - statusCache.at < 60_000) return statusCache.available;
  try {
    const res = await fetch('/api/ai/status', { cache: 'no-store' });
    const data = (await res.json()) as { available?: boolean };
    statusCache = { at: Date.now(), available: !!data.available };
  } catch {
    statusCache = { at: Date.now(), available: false };
  }
  return statusCache.available;
}

const toJpeg = (source: CanvasImageSource, w: number, h: number, maxSide = 512) => {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w * scale));
  canvas.height = Math.max(2, Math.round(h * scale));
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};

/** Up to `count` frames spread through the clip, as small JPEG data URLs. */
export async function videoFrames(url: string, duration: number, count = 8): Promise<string[]> {
  const v = document.createElement('video');
  if (/^https?:/i.test(url)) v.crossOrigin = 'anonymous';
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  await new Promise<void>((resolve, reject) => {
    v.onloadeddata = () => resolve();
    v.onerror = () => reject(new Error('video'));
  });
  const len = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : duration;
  const frames: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = Math.min(len - 0.05, (len * (i + 0.5)) / count);
    await new Promise<void>((resolve) => {
      const done = () => {
        v.removeEventListener('seeked', done);
        resolve();
      };
      v.addEventListener('seeked', done);
      v.currentTime = Math.max(0, t);
    });
    try {
      frames.push(toJpeg(v, v.videoWidth || 512, v.videoHeight || 512));
    } catch {
      break; // a frame we may not read (cross-origin without CORS)
    }
  }
  v.removeAttribute('src');
  v.load();
  return frames;
}

/** A photo (e.g. an import's cover) as one small JPEG frame. */
export async function imageFrame(blob: Blob): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(blob);
    const out = toJpeg(bmp, bmp.width, bmp.height, 768);
    bmp.close();
    return out;
  } catch {
    return null;
  }
}

export type AiResult = { ok: true; fill: AiFill } | { ok: false; off: boolean; message: string };

export async function aiFill(task: AiTask, input: { frames?: string[]; text?: string }): Promise<AiResult> {
  try {
    const res = await fetch('/api/ai/fill', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ task, ...input }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, off: false, message: typeof data.error === 'string' ? data.error : 'FUZO AI could not help this time.' };
    if (data.off) {
      statusCache = { at: Date.now(), available: false };
      return { ok: false, off: true, message: data.message ?? 'FUZO AI is paused.' };
    }
    return { ok: true, fill: data as AiFill };
  } catch {
    return { ok: false, off: false, message: 'FUZO AI could not help this time.' };
  }
}
