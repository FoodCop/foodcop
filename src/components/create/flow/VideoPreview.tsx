'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronRight, Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import type { CreateVideo } from './types';

// Video posts, step 2 (client, 2026-10-16; docs/VIDEO_URL_PLAN.md): watch the
// clip, choose the cover frame with the slider, Retake or Next. Gallery clips
// are re-encoded in the background (CreateFlow) - the user can go on while it
// works; Post waits for it.

interface VideoPreviewProps {
  video: CreateVideo;
  onCoverTime: (seconds: number) => void;
  /** Start preparing again (after an error, or when the browser needs a tap first). */
  onRetryPrep: () => void;
  onRetake: () => void;
  onNext: () => void;
}

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function VideoPreview({ video, onCoverTime, onRetryPrep, onRetake, onNext }: VideoPreviewProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const duration = Math.max(0.1, video.duration);

  // Show the cover frame when the clip loads.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => {
      el.currentTime = Math.min(video.coverTime, duration - 0.05);
    };
    if (el.readyState >= 1) show();
    else el.addEventListener('loadedmetadata', show, { once: true });
    return () => el.removeEventListener('loadedmetadata', show);
    // Only when the clip changes, not on every cover move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.url]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {});
    else {
      el.pause();
      setPlaying(false);
    }
  };

  const moveCover = (t: number) => {
    const el = ref.current;
    if (el) {
      el.pause();
      setPlaying(false);
      el.currentTime = t;
    }
    onCoverTime(t);
  };

  const prep = video.prep;
  return (
    <div className="cf-vprev">
      <div className="cf-vprev__stage">
        <video
          ref={ref}
          className="cf-vprev__video"
          src={video.url}
          playsInline
          loop
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
          aria-label="Your video"
        />
        <button type="button" className="cf-vprev__play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <span className="cf-vprev__len">{clock(video.duration)}</span>
      </div>

      <div className="cf-vprev__panel">
        <label htmlFor="cf-cover" className="cf-vprev__label">
          Cover <span>{clock(video.coverTime)}</span>
        </label>
        <input
          id="cf-cover"
          className="cf-vprev__cover"
          type="range"
          min={0}
          max={Math.max(0, duration - 0.05)}
          step={0.1}
          value={Math.min(video.coverTime, duration)}
          onChange={(e) => moveCover(Number(e.target.value))}
          aria-valuetext={`Cover frame at ${clock(video.coverTime)}`}
        />
        <p className="cf-vprev__hint">Slide to choose the frame people see before they tap play.</p>

        {prep.status === 'working' && (
          <div className="cf-vprev__prep" role="status">
            <Loader2 size={16} className="scout-spin" aria-hidden="true" />
            <span>Getting your video ready… {Math.round(prep.progress * 100)}% - you can carry on.</span>
            <span className="cf-vprev__bar" aria-hidden="true">
              <span style={{ width: `${Math.round(prep.progress * 100)}%` }} />
            </span>
          </div>
        )}
        {prep.status === 'error' && (
          <div className="cf-vprev__prep is-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{prep.message}</span>
            <button type="button" className="cf-chipbtn" onClick={onRetryPrep}>
              Prepare video
            </button>
          </div>
        )}

        <div className="cf-vprev__actions">
          <button type="button" className="cf-bar__draft" onClick={onRetake}>
            <RotateCcw size={17} aria-hidden="true" /> Retake
          </button>
          <button type="button" className="cf-bar__post" onClick={onNext}>
            Next <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPreview;
