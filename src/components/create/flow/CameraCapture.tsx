'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, ChevronRight, ImagePlus, Link2, SwitchCamera, Video, X, Zap, ZapOff } from 'lucide-react';
import { MAX_PHOTOS, type CreateMode, type CreatePhoto } from './types';

// Step 1 of the Create flow: a full-screen camera like Instagram's. Live
// camera with a shutter, front / back switch and flash (where the phone
// supports it), a gallery button, the photos picked so far (up to 5) and the
// Photo · Video · URL tabs. Video and URL come later (plan, phase "Later").
// Without camera access (refused, no camera, not https) it falls back to the
// gallery.

type CameraStatus = 'starting' | 'live' | 'denied' | 'nocamera' | 'unsupported' | 'error';

interface CameraCaptureProps {
  mode: CreateMode;
  onModeChange: (mode: CreateMode) => void;
  photos: CreatePhoto[];
  onAddPhotos: (photos: CreatePhoto[]) => void;
  onRemovePhoto: (id: string) => void;
  onNext: () => void;
  onClose: () => void;
}

const MODES: { id: CreateMode; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'video', label: 'Video' },
  { id: 'url', label: 'URL' },
];

const newId = () => crypto.randomUUID();

export function CameraCapture({ mode, onModeChange, photos, onAddPhotos, onRemovePhoto, onNext, onClose }: CameraCaptureProps) {
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

  const remaining = MAX_PHOTOS - photos.length;
  const photoMode = mode === 'photo';

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
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

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

  const openGallery = () => fileRef.current?.click();

  const fallback = status === 'denied' || status === 'nocamera' || status === 'unsupported' || status === 'error';
  const fallbackText: Record<string, string> = {
    denied: 'Camera access is off. Allow it in your browser settings, or pick photos from your gallery.',
    nocamera: "We couldn't find a camera on this device. Pick photos from your gallery instead.",
    unsupported: "This browser can't open the camera here. Pick photos from your gallery instead.",
    error: "The camera didn't start. Pick photos from your gallery, or close and try again.",
  };

  return (
    <div className="cf-cam" aria-label="Take or choose photos">
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

      {/* Top bar */}
      <div className="cf-cam__top">
        <button type="button" className="cf-cam__icon" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        {photoMode && status === 'live' && torchSupported && (
          <button type="button" className="cf-cam__icon" onClick={toggleTorch} aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'} aria-pressed={torchOn}>
            {torchOn ? <Zap size={22} /> : <ZapOff size={22} />}
          </button>
        )}
        <span className="cf-cam__count" aria-live="polite">{photos.length}/{MAX_PHOTOS}</span>
      </div>

      {/* Viewfinder */}
      <div className="cf-cam__view">
        <video
          ref={videoRef}
          className={`cf-cam__video${facing === 'user' ? ' is-mirrored' : ''}${status === 'live' ? ' is-live' : ''}${photoMode ? '' : ' is-hidden'}`}
          playsInline
          muted
          autoPlay
          aria-hidden="true"
        />

        {photoMode && status === 'starting' && <div className="cf-cam__msg">Opening camera…</div>}

        {photoMode && fallback && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            <Camera size={40} aria-hidden="true" />
            <p>{fallbackText[status]}</p>
            <button type="button" className="cf-cam__pill" onClick={openGallery}>
              <ImagePlus size={18} /> Choose from gallery
            </button>
          </div>
        )}

        {mode !== 'photo' && (
          <div className="cf-cam__msg cf-cam__msg--fallback">
            {mode === 'video' ? <Video size={40} aria-hidden="true" /> : <Link2 size={40} aria-hidden="true" />}
            <p>{mode === 'video' ? 'Video posts are coming soon.' : 'Posting a link is coming soon.'}</p>
            <button type="button" className="cf-cam__pill" onClick={() => onModeChange('photo')}>
              <Camera size={18} /> Take photos instead
            </button>
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

      {/* Picked photos + Next */}
      {photos.length > 0 && (
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
        <button type="button" className="cf-cam__side" onClick={openGallery} aria-label="Choose photos from gallery" disabled={remaining <= 0}>
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[photos.length - 1].url} alt="" />
          ) : (
            <ImagePlus size={22} />
          )}
        </button>
        <button
          type="button"
          className="cf-cam__shutter"
          onClick={capture}
          disabled={!photoMode || status !== 'live'}
          aria-label="Take photo"
        >
          <span />
        </button>
        <button
          type="button"
          className="cf-cam__side"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="Switch camera"
          disabled={!photoMode || status !== 'live' || !canSwitch}
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
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CameraCapture;
