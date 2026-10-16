'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, ChevronRight, FileClock, Film, ImagePlus, Link2, SwitchCamera, X, Zap, ZapOff } from 'lucide-react';
import { baseMime, readVideoMeta, recorderMime, VIDEO_BITRATE } from '@/lib/media/video';
import { MAX_PHOTOS, MAX_VIDEO_INPUT_BYTES, MAX_VIDEO_SECONDS, type CreateMode, type CreatePhoto, type CreateVideo } from './types';

// Step 1 of the Create flow: a full-screen camera like Instagram's. Live
// camera with a shutter, front / back switch and flash (where the phone
// supports it), a gallery button, the photos picked so far (up to 5) and the
// Photo · Video · URL tabs. Video (client, 2026-10-16; docs/VIDEO_URL_PLAN.md):
// the shutter becomes a record button (tap to start / stop, stops itself at
// 60 s; the microphone is asked for only then), or one clip from the gallery.
// URL comes later. Without camera access (refused, no camera, not https) it
// falls back to the gallery.

type CameraStatus = 'starting' | 'live' | 'denied' | 'nocamera' | 'unsupported' | 'error';

interface CameraCaptureProps {
  mode: CreateMode;
  onModeChange: (mode: CreateMode) => void;
  photos: CreatePhoto[];
  onAddPhotos: (photos: CreatePhoto[]) => void;
  onRemovePhoto: (id: string) => void;
  onNext: () => void;
  onClose: () => void;
  /** Unfinished posts the user can go back to ("Drafts" button; hidden at 0). */
  draftCount?: number;
  onOpenDrafts?: () => void;
  /** The post's video (video mode), and a newly recorded / picked one. */
  video?: CreateVideo | null;
  onVideo?: (video: CreateVideo) => void;
  onRemoveVideo?: () => void;
}

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const MODES: { id: CreateMode; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'video', label: 'Video' },
  { id: 'url', label: 'URL' },
];

const newId = () => crypto.randomUUID();

export function CameraCapture({
  mode,
  onModeChange,
  photos,
  onAddPhotos,
  onRemovePhoto,
  onNext,
  onClose,
  draftCount = 0,
  onOpenDrafts,
  video = null,
  onVideo,
  onRemoveVideo,
}: CameraCaptureProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CameraStatus>('starting');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [canSwitch, setCanSwitch] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [flash, setFlash] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  // Recording (video mode).
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const remaining = MAX_PHOTOS - photos.length;
  const photoMode = mode === 'photo';
  const videoMode = mode === 'video';
  // A post is photos or one video, not both.
  const videoBlocked = videoMode && photos.length > 0;
  const photoBlocked = photoMode && !!video;
  const cameraMode = (photoMode && !photoBlocked) || (videoMode && !videoBlocked);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Start (or restart, when switching lenses) the camera. It stays on while
  // this screen is open - also on the Video / URL tabs, so switching tabs is
  // instant - and stops when the user moves on or closes.
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      setStatus('starting');
      try {
        // A camera that was just switched off (another tab here, the other
        // lens) can take a moment to be free again: retry briefly before
        // telling the user there's no camera.
        let stream: MediaStream | null = null;
        for (let attempt = 0; !stream; attempt += 1) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
              audio: false,
            });
          } catch (err) {
            const name = err instanceof DOMException ? err.name : '';
            const busy = name === 'NotFoundError' || name === 'NotReadableError' || name === 'AbortError';
            if (!busy || attempt >= 3 || cancelled) throw err;
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          }
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(!!caps.torch);
        setTorchOn(false);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
        if (!cancelled) {
          setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);
          setStatus('live');
        }
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : '';
        setStatus(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'denied'
            : name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError'
              ? 'nocamera'
              : 'error',
        );
      }
    };

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [facing, stopCamera]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.length > 60 ? 5000 : 2200);
    return () => clearTimeout(t);
  }, [notice]);

  // ---- Video: record ----------------------------------------------------------
  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  const startRecording = async () => {
    const stream = streamRef.current;
    const videoEl = videoRef.current;
    if (!stream || status !== 'live' || recording) return;
    if (recorderMime() === null) {
      setNotice("This browser can't record video. Choose one from your gallery.");
      return;
    }
    // Sound: ask for the microphone only now; without it, record silently.
    let mic: MediaStream | null = null;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setNotice('Recording without sound - the microphone is off.');
    }
    micRef.current = mic;
    // Record a copy of the camera track: recording the one the preview shows
    // can come out empty in some browsers. The copy is stopped afterwards.
    const tracks = [...stream.getVideoTracks().map((t) => t.clone()), ...(mic?.getAudioTracks() ?? [])];
    const mime = recorderMime(!!mic?.getAudioTracks().length);
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(new MediaStream(tracks), { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: VIDEO_BITRATE });
    } catch {
      tracks.forEach((t) => t.stop());
      mic?.getTracks().forEach((t) => t.stop());
      setNotice("This browser can't record video. Choose one from your gallery.");
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      tracks.forEach((t) => t.stop());
      micRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current = null;
      recorderRef.current = null;
      setRecording(false);
      const duration = Math.min(MAX_VIDEO_SECONDS, (performance.now() - startedAtRef.current) / 1000);
      if (duration < 1) {
        setNotice('Hold on a little longer - videos need at least 1 second.');
        return;
      }
      const blob = new Blob(chunks, { type: baseMime(rec.mimeType || mime || 'video/webm') });
      if (!blob.size) {
        setNotice("That recording didn't save - please record it again.");
        return;
      }
      const settings = stream.getVideoTracks()[0]?.getSettings?.() ?? {};
      onVideo?.({
        id: newId(),
        file: blob,
        url: URL.createObjectURL(blob),
        duration,
        width: videoEl?.videoWidth || settings.width || 0,
        height: videoEl?.videoHeight || settings.height || 0,
        source: 'camera',
        prep: { status: 'ready' },
        coverTime: Math.min(1, duration / 2),
      });
    };
    recorderRef.current = rec;
    startedAtRef.current = performance.now();
    setElapsed(0);
    rec.start(1000);
    setRecording(true);
  };

  // Timer + the 60 s limit.
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      const sec = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(sec);
      if (sec >= MAX_VIDEO_SECONDS) stopRecording();
    }, 200);
    return () => clearInterval(t);
  }, [recording, stopRecording]);

  // Leaving the screen while recording throws that recording away.
  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.onstop = null;
        rec.stop();
      }
      micRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  // ---- Video: pick from the gallery ---------------------------------------------
  const pickVideo = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setNotice('Please choose a video.');
      return;
    }
    if (file.size > MAX_VIDEO_INPUT_BYTES) {
      setNotice('That video is too big. Choose a shorter clip (up to 60 seconds).');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const meta = await readVideoMeta(url);
      if (meta.duration > MAX_VIDEO_SECONDS + 0.5) {
        URL.revokeObjectURL(url);
        setNotice(`Videos can be up to 1:00 - this one is ${clock(meta.duration)}. Trim it in your phone's gallery first, then pick it again.`);
        return;
      }
      onVideo?.({
        id: newId(),
        file,
        url,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        source: 'gallery',
        prep: { status: 'working', progress: 0 },
        coverTime: Math.min(1, meta.duration / 2),
      });
    } catch (err) {
      URL.revokeObjectURL(url);
      setNotice(err instanceof Error ? err.message : "This video can't be opened. Try another one.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || status !== 'live' || !video.videoWidth) return;
    if (remaining <= 0) {
      setNotice(`Up to ${MAX_PHOTOS} photos per post.`);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // The front camera preview is mirrored; save what the user saw.
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash((n) => n + 1);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onAddPhotos([{ id: newId(), file: blob, url: URL.createObjectURL(blob), source: 'camera' }]);
      },
      'image/jpeg',
      0.9,
    );
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const pickFromGallery = (files: FileList | null) => {
    if (!files?.length) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      setNotice('Please choose photos.');
      return;
    }
    if (images.length > remaining) {
      setNotice(remaining > 0 ? `Added the first ${remaining}. Up to ${MAX_PHOTOS} photos per post.` : `Up to ${MAX_PHOTOS} photos per post.`);
    }
    const added = images.slice(0, Math.max(remaining, 0)).map((file) => ({
      id: newId(),
      file,
      url: URL.createObjectURL(file),
      source: 'gallery' as const,
    }));
    if (added.length) onAddPhotos(added);
  };

  const openGallery = () => (videoMode ? videoFileRef : fileRef).current?.click();

  const fallback = status === 'denied' || status === 'nocamera' || status === 'unsupported' || status === 'error';
  const fallbackText: Record<string, string> = {
    denied: 'Camera access is off. Allow it in your browser settings, or pick photos from your gallery.',
    nocamera: "We couldn't find a camera on this device. Pick photos from your gallery instead.",
    unsupported: "This browser can't open the camera here. Pick photos from your gallery instead.",
    error: "The camera didn't start. Pick photos from your gallery, or close and try again.",
  };

  return (
    <div className="cf-cam" aria-label={videoMode ? 'Record or choose a video' : 'Take or choose photos'}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pickFromGallery(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          pickVideo(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Top bar */}
      <div className="cf-cam__top">
        <button type="button" className="cf-cam__icon" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        {cameraMode && status === 'live' && torchSupported && (
          <button type="button" className="cf-cam__icon" onClick={toggleTorch} aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'} aria-pressed={torchOn}>
            {torchOn ? <Zap size={22} /> : <ZapOff size={22} />}
          </button>
        )}
        {draftCount > 0 && onOpenDrafts && photos.length === 0 && !video && !recording && (
          <button type="button" className="cf-cam__drafts" onClick={onOpenDrafts}>
            <FileClock size={16} aria-hidden="true" /> Drafts <span className="cf-cam__drafts-n">{draftCount}</span>
          </button>
        )}
        {videoMode ? (
          <span className={`cf-cam__count cf-cam__timer${recording ? ' is-recording' : ''}`} aria-live="off">
            {recording && <span className="cf-cam__rec-dot" aria-hidden="true" />}
            {clock(recording ? elapsed : 0)} / {clock(MAX_VIDEO_SECONDS)}
          </span>
        ) : (
          <span className="cf-cam__count" aria-live="polite">{photos.length}/{MAX_PHOTOS}</span>
        )}
      </div>

      {/* Viewfinder */}
      <div className="cf-cam__view">
        <video
          ref={videoRef}
          className={`cf-cam__video${facing === 'user' ? ' is-mirrored' : ''}${status === 'live' ? ' is-live' : ''}${cameraMode ? '' : ' is-hidden'}`}
          playsInline
          muted
          autoPlay
          aria-hidden="true"
        />

        {cameraMode && status === 'starting' && <div className="cf-cam__msg">Opening camera…</div>}

        {cameraMode && fallback && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            <Camera size={40} aria-hidden="true" />
            <p>{videoMode ? fallbackText[status].replace('pick photos', 'pick a video').replace('Pick photos', 'Pick a video') : fallbackText[status]}</p>
            <button type="button" className="cf-cam__pill" onClick={openGallery}>
              {videoMode ? <Film size={18} /> : <ImagePlus size={18} />} Choose from gallery
            </button>
          </div>
        )}

        {videoBlocked && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            <Film size={40} aria-hidden="true" />
            <p>A post is either photos or one video. Remove your photos to post a video.</p>
            <button type="button" className="cf-cam__pill" onClick={() => onModeChange('photo')}>
              <Camera size={18} /> Back to photos
            </button>
          </div>
        )}

        {photoBlocked && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            <Camera size={40} aria-hidden="true" />
            <p>A post is either photos or one video. Remove your video to take photos.</p>
            <button type="button" className="cf-cam__pill" onClick={() => onModeChange('video')}>
              <Film size={18} /> Back to video
            </button>
          </div>
        )}

        {mode === 'url' && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            <Link2 size={40} aria-hidden="true" />
            <p>Posting a link is coming soon.</p>
            <button type="button" className="cf-cam__pill" onClick={() => onModeChange('photo')}>
              <Camera size={18} /> Take photos instead
            </button>
          </div>
        )}

        {recording && (
          <div className="cf-cam__rec-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (elapsed / MAX_VIDEO_SECONDS) * 100)}%` }} />
          </div>
        )}

        <AnimatePresence>
          {flash > 0 && !reduceMotion && (
            <motion.div
              key={flash}
              className="cf-cam__flash"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notice && (
            <motion.div
              className="cf-cam__notice"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The video + Next (video mode) */}
      {videoMode && video && !recording && (
        <div className="cf-cam__tray">
          <ul className="cf-cam__thumbs" aria-label="Video in this post">
            <li className="cf-cam__thumb cf-cam__thumb--video">
              <video src={video.url} muted playsInline preload="metadata" aria-label={`Video, ${clock(video.duration)}`} />
              <span className="cf-cam__thumb-len">{clock(video.duration)}</span>
              <button type="button" className="cf-cam__thumb-remove" onClick={onRemoveVideo} aria-label="Remove video">
                <X size={12} strokeWidth={3} />
              </button>
            </li>
          </ul>
          <button type="button" className="cf-cam__next" onClick={onNext}>
            Next <ChevronRight size={18} strokeWidth={2.6} />
          </button>
        </div>
      )}

      {/* Picked photos + Next */}
      {photoMode && photos.length > 0 && (
        <div className="cf-cam__tray">
          <ul className="cf-cam__thumbs" aria-label="Photos in this post">
            {photos.map((p, i) => (
              <li key={p.id} className="cf-cam__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} />
                <button type="button" className="cf-cam__thumb-remove" onClick={() => onRemovePhoto(p.id)} aria-label={`Remove photo ${i + 1}`}>
                  <X size={12} strokeWidth={3} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="cf-cam__next" onClick={onNext}>
            Next <ChevronRight size={18} strokeWidth={2.6} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="cf-cam__controls">
        <button
          type="button"
          className="cf-cam__side"
          onClick={openGallery}
          aria-label={videoMode ? 'Choose a video from gallery' : 'Choose photos from gallery'}
          disabled={videoMode ? videoBlocked || recording : photoBlocked || remaining <= 0}
        >
          {videoMode ? (
            <Film size={22} />
          ) : photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[photos.length - 1].url} alt="" />
          ) : (
            <ImagePlus size={22} />
          )}
        </button>
        {videoMode ? (
          <button
            type="button"
            className={`cf-cam__shutter cf-cam__shutter--video${recording ? ' is-recording' : ''}`}
            onClick={recording ? stopRecording : startRecording}
            disabled={videoBlocked || status !== 'live'}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            aria-pressed={recording}
          >
            <span />
          </button>
        ) : (
          <button type="button" className="cf-cam__shutter" onClick={capture} disabled={!photoMode || photoBlocked || status !== 'live'} aria-label="Take photo">
            <span />
          </button>
        )}
        <button
          type="button"
          className="cf-cam__side"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="Switch camera"
          disabled={!cameraMode || status !== 'live' || !canSwitch || recording}
          style={{ visibility: canSwitch ? 'visible' : 'hidden' }}
        >
          <SwitchCamera size={22} />
        </button>
      </div>

      {/* Photo · Video · URL */}
      <div className="cf-cam__modes" role="tablist" aria-label="What to post">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`cf-cam__mode${mode === m.id ? ' is-active' : ''}`}
            onClick={() => onModeChange(m.id)}
            disabled={recording}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CameraCapture;
