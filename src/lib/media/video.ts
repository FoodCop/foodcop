// Video helpers for video posts (client, 2026-10-16; plan: docs/VIDEO_URL_PLAN.md).
// All in the browser, no extra libraries:
// - recorderMime(): the best format this browser can record (MP4 where
//   supported - Safari, newer Chrome - else WebM).
// - readVideoMeta(): length and size of a clip (also for WebM recordings,
//   which often report an unknown length).
// - prepareVideo(): re-encodes a gallery video to at most 720p / 2.5 Mbit/s.
//   Phone clips can be hundreds of MB (storage takes 100 MB per file), and the
//   re-encode drops the file's hidden location and device data - the same
//   privacy rule as photos. It plays the clip into a canvas and records that,
//   so it takes about as long as the clip (max 60 s).
// - coverFrame(): one frame as a JPEG, for the cover.

export const VIDEO_BITRATE = 2_500_000;
const AUDIO_BITRATE = 128_000;
const MAX_SIDE = 1280; // 720p for 16:9; portrait clips become 720x1280

// A format that names an audio codec records nothing at all when the stream
// has no sound track (e.g. the microphone was refused), so the list depends on it.
const MIME_WITH_AUDIO = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
const MIME_VIDEO_ONLY = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

/** The recording format to use ('' = the browser's default), or null when this browser can't record video. */
export function recorderMime(withAudio = true): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return (withAudio ? MIME_WITH_AUDIO : MIME_VIDEO_ONLY).find((m) => MediaRecorder.isTypeSupported?.(m)) ?? '';
}

/** "video/webm;codecs=vp9" -> "video/webm" (what storage expects). */
export const baseMime = (mime: string) => (mime.split(';')[0] || 'video/webm').trim();

export const videoExtension = (mime: string) => {
  const base = baseMime(mime);
  return base === 'video/mp4' ? 'mp4' : base === 'video/quicktime' ? 'mov' : 'webm';
};

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

const loadVideo = (src: string) =>
  new Promise<HTMLVideoElement>((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("This video can't be opened. Try another one."));
    v.src = src;
  });

/** Length and size of a clip. WebM recordings often say "Infinity" until you seek to the end. */
export async function readVideoMeta(src: string): Promise<VideoMeta> {
  const v = await loadVideo(src);
  let duration = v.duration;
  if (!Number.isFinite(duration)) {
    duration = await new Promise<number>((resolve) => {
      v.ontimeupdate = () => {
        v.ontimeupdate = null;
        resolve(Number.isFinite(v.duration) ? v.duration : v.currentTime);
      };
      v.currentTime = 1e7;
    });
  }
  const meta = { duration, width: v.videoWidth, height: v.videoHeight };
  v.removeAttribute('src');
  v.load();
  return meta;
}

const fitWithin = (w: number, h: number, max: number) => {
  const scale = Math.min(1, max / Math.max(w, h));
  // Even sizes keep video encoders happy.
  return { width: Math.max(2, Math.round((w * scale) / 2) * 2), height: Math.max(2, Math.round((h * scale) / 2) * 2) };
};

const seek = (v: HTMLVideoElement, time: number) =>
  new Promise<void>((resolve) => {
    const done = () => {
      v.removeEventListener('seeked', done);
      resolve();
    };
    v.addEventListener('seeked', done);
    v.currentTime = Math.max(0, time);
  });

/** One frame of a clip as a JPEG (the cover), at most 1080 px on its longest side. */
export async function coverFrame(src: string, time: number): Promise<Blob> {
  const v = await loadVideo(src);
  await seek(v, Math.min(time, Math.max(0, (Number.isFinite(v.duration) ? v.duration : time) - 0.05)));
  const { width, height } = fitWithin(v.videoWidth || 720, v.videoHeight || 1280, 1080);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(v, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  v.removeAttribute('src');
  v.load();
  if (!blob) throw new Error("Couldn't make the cover.");
  return blob;
}

/** prepareVideo() needs to be started from a tap (browsers only play sound after one). */
export class NeedsTapError extends Error {
  constructor() {
    super('Tap to prepare the video.');
    this.name = 'NeedsTapError';
  }
}

/**
 * Re-encodes a clip to at most 720p / 2.5 Mbit/s, without the file's hidden
 * data. Plays it (silently for the user) into a canvas + the clip's sound,
 * records that, and reports progress 0-1. Rejects if the browser can't.
 */
export async function prepareVideo(file: Blob, onProgress: (p: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (recorderMime() === null) throw new Error("This browser can't prepare videos.");
  const src = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.src = src;
  v.playsInline = true;
  v.preload = 'auto';
  await new Promise<void>((resolve, reject) => {
    v.onloadeddata = () => resolve();
    v.onerror = () => reject(new Error("This video can't be opened. Try another one."));
  });

  const { width, height } = fitWithin(v.videoWidth, v.videoHeight, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser can't prepare videos.");
  const stream = canvas.captureStream(30);

  // The clip's sound goes to the recording only (not the speakers).
  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioContext();
    const sourceNode = audioCtx.createMediaElementSource(v);
    const dest = audioCtx.createMediaStreamDestination();
    sourceNode.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch {
    // No sound track (or no Web Audio): the video is kept without sound.
  }

  const mime = recorderMime(stream.getAudioTracks().length > 0);
  const recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: VIDEO_BITRATE, audioBitsPerSecond: AUDIO_BITRATE });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 60;
  let raf = 0;
  const draw = () => {
    ctx.drawImage(v, 0, 0, width, height);
    onProgress(Math.min(0.99, v.currentTime / duration));
    if (!v.ended && !v.paused) raf = requestAnimationFrame(draw);
  };

  const cleanup = () => {
    cancelAnimationFrame(raf);
    v.pause();
    stream.getTracks().forEach((t) => t.stop());
    audioCtx?.close().catch(() => {});
    URL.revokeObjectURL(src);
  };

  try {
    await audioCtx?.resume().catch(() => {});
    try {
      await v.play();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') throw new NeedsTapError();
      throw err;
    }
    v.currentTime = 0;
    recorder.start(1000);
    raf = requestAnimationFrame(draw);
    await new Promise<void>((resolve, reject) => {
      v.onended = () => resolve();
      v.onerror = () => reject(new Error('The video stopped playing while preparing it.'));
      signal?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
    });
    ctx.drawImage(v, 0, 0, width, height);
    recorder.stop();
    await stopped;
  } catch (err) {
    if (recorder.state !== 'inactive') recorder.stop();
    cleanup();
    throw err;
  }
  cleanup();
  onProgress(1);
  const out = new Blob(chunks, { type: baseMime(recorder.mimeType || mime || 'video/webm') });
  if (!out.size) throw new Error("Couldn't prepare this video.");
  return out;
}
