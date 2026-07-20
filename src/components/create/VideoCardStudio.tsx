'use client';

import React, { useRef, useState } from 'react';
import { X, Video as VideoIcon, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { StudioStepper } from '@/components/ui/StudioStepper';
import { NeuralReveal } from '@/components/ui/NeuralReveal';
import { extractVideoFrameAsDataUrl, getYoutubeVideoId, parseAiJson } from '@/lib/utils/studioHelpers';
import { GeminiService } from '@/lib/services/geminiService';
import { YouTubeService } from '@/lib/services/youtubeService';
import { TAXONOMY_KEYWORD_MAP } from '@/lib/utils/taxonomy';
import { foodCardService } from '@/lib/services/foodCardService';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import { FlavorSliders } from './shared/FlavorSliders';
import { TagChips } from './shared/TagChips';
import { Dropzone } from './shared/Dropzone';
import { CardSuccessScreen } from './shared/CardSuccessScreen';
import { DEFAULT_FLAVOR, emptyCardTags, TYPE_META, type FoodCardType, type FlavorVector, type CardTags, type FoodCardRecord } from '@/lib/types/foodCard';

// Video family (BITE_VIDEO). Modeled on TRIMS_STUDIO_READY_RECKONER.md's
// two-pipeline pattern: an uploaded video runs through Identity/Story +
// Gemini analysis of the extracted thumbnail; a pasted YouTube URL is a
// "Zero-LLM" path - oEmbed-style metadata + local taxonomy keyword tagging,
// straight to Review, to avoid burning a Gemini call and rate limits on
// content we can already describe from its own metadata.
const UPLOAD_STEPS = ['Media', 'Identity', 'Reveal', 'Review'];
const YOUTUBE_STEPS = ['Media', 'Review'];

const extractLocalTags = (text: string): string[] => {
  const found: string[] = [];
  const lower = text.toLowerCase();
  Object.entries(TAXONOMY_KEYWORD_MAP).forEach(([keyword, tag]) => {
    if (lower.includes(keyword.toLowerCase())) found.push(tag);
  });
  return [...new Set(found)];
};

interface VideoCardStudioProps {
  cardType: FoodCardType;
  onClose: () => void;
  onCreated: () => void;
  onDone: () => void;
}

export const VideoCardStudio: React.FC<VideoCardStudioProps> = ({ cardType, onClose, onCreated, onDone }) => {
  const meta = TYPE_META[cardType];
  const [source, setSource] = useState<'upload' | 'youtube' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<CardTags>(emptyCardTags());
  const [flavorProfile, setFlavorProfile] = useState<FlavorVector>(DEFAULT_FLAVOR);
  const [isSaving, setIsSaving] = useState(false);
  const [createdCard, setCreatedCard] = useState<FoodCardRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleVideoFile = async (file: File) => {
    setSource('upload');
    setVideoFile(file);
    try {
      const frame = await extractVideoFrameAsDataUrl(file);
      setThumbnail(frame);
    } catch (err) {
      console.warn('Thumbnail extraction failed:', err);
    }
    setCurrentStep(1);
  };

  const handleYoutubeSubmit = async () => {
    const videoId = getYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      setError('Paste a valid YouTube video, shorts, or share URL.');
      return;
    }
    setSource('youtube');
    setIsFetchingYoutube(true);
    setError(null);
    try {
      const result = await YouTubeService.getVideoDetails(videoId);
      if (!mountedRef.current) return;
      const video = result.success ? result.data?.items?.[0] : undefined;
      const snippet = video?.snippet;
      setTitle(snippet?.title || 'Untitled Trim');
      setCaption(snippet?.description?.slice(0, 280) || '');
      setThumbnail(snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || null);
      setMediaUrl(youtubeUrl);
      const localTags = extractLocalTags(`${snippet?.title || ''} ${snippet?.description || ''}`);
      setTags((prev) => ({ ...prev, food_type: localTags }));
      setCurrentStep(1);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'Could not fetch video details.');
    } finally {
      if (mountedRef.current) setIsFetchingYoutube(false);
    }
  };

  const runAnalysis = async () => {
    try {
      const raw = await GeminiService.analyzeCard(cardType, caption, thumbnail || undefined);
      const parsed = parseAiJson(raw) || {};
      if (!mountedRef.current) return;
      setTitle((prev) => prev || parsed.title || '');
      setCaption((prev) => prev || parsed.caption || '');
      if (parsed.flavor_profile) setFlavorProfile((prev) => ({ ...prev, ...parsed.flavor_profile }));
      if (Array.isArray(parsed.tags)) setTags((prev) => ({ ...prev, food_type: [...new Set([...prev.food_type, ...parsed.tags])] }));
    } catch (err) {
      console.warn('Video card neural analysis failed:', err);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    setError(null);
    try {
      let finalMediaUrl = mediaUrl;
      if (source === 'upload' && videoFile) {
        const uploadResult = await MediaUploadService.uploadVideo(videoFile);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Video upload failed. Please try again.');
          return;
        }
        finalMediaUrl = uploadResult.data ?? null;
      }

      const result = await foodCardService.createFoodCard(
        {
          cardType,
          title: title || meta.label,
          caption,
          tags,
          flavorProfile,
          mediaUrl: finalMediaUrl || undefined,
          imageUrl: thumbnail || undefined,
        },
        status,
      );
      if (result.success && result.data) {
        setCreatedCard(result.data);
        onCreated();
      } else {
        setError(result.error || 'Failed to save. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const steps = source === 'youtube' ? YOUTUBE_STEPS : UPLOAD_STEPS;
  const stepIndex = source === 'youtube' ? (currentStep === 0 ? 0 : 1) : currentStep;

  return (
    <div role="dialog" aria-modal="true" className="studio-modal">
      <header className="studio-header">
        <StudioStepper steps={steps} currentStep={stepIndex} />
        <button onClick={onClose} aria-label="Close" className="studio-close">
          <X size={22} />
        </button>
      </header>

      <div className="studio-body">
        {currentStep === 0 && (
          <div className="studio-panel">
            <div className="studio-panel__inner studio-panel__inner--center">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">{meta.emoji} {meta.label}</span>
                <h2 className="studio-heading">Bring the Motion</h2>
              </div>

              <Dropzone accept="video/*" className="studio-dropzone--video" onFile={handleVideoFile}>
                <VideoIcon size={32} />
                <span className="studio-dropzone__label">Upload or Drop a Vertical Video</span>
              </Dropzone>

              <div className="studio-divider">or</div>

              <div className="studio-panel__group">
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste a YouTube URL..."
                  className="studio-input"
                />
                {error && <p className="studio-error-text">{error}</p>}
                <button
                  onClick={handleYoutubeSubmit}
                  disabled={!youtubeUrl || isFetchingYoutube}
                  className="studio-cta"
                >
                  {isFetchingYoutube ? <Loader2 size={16} className="scout-spin" /> : <LinkIcon size={16} />}
                  {' '}Use This Link
                </button>
              </div>
            </div>
          </div>
        )}

        {source === 'upload' && currentStep === 1 && (
          <div className="studio-panel">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Identity</span>
                <h2 className="studio-heading">Title It</h2>
              </div>
              {thumbnail && <img src={thumbnail} alt="" className="studio-thumb" />}
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="High-impact, vertical-friendly title"
                className="studio-input"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption..."
                className="studio-textarea"
              />
              <button onClick={() => { setCurrentStep(2); runAnalysis(); }} disabled={!title} className="studio-cta">
                Neural Sync
              </button>
            </div>
          </div>
        )}

        {source === 'upload' && currentStep === 2 && <NeuralReveal onNext={() => setCurrentStep(3)} />}

        {((source === 'upload' && currentStep === 3) || (source === 'youtube' && currentStep === 1)) && !createdCard && (
          <div className="studio-panel--scroll">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Review</span>
                <h2 className="studio-heading">{meta.emoji} {title || meta.label}</h2>
              </div>

              {thumbnail && <img src={thumbnail} alt="" className="studio-thumb" />}

              <input value={title} onChange={(e) => setTitle(e.target.value)} className="studio-input" />

              <TagChips value={tags} onChange={setTags} categories={['cuisine', 'meal_type']} />
              <FlavorSliders value={flavorProfile} onChange={setFlavorProfile} />

              {error && <p className="studio-error-text">{error}</p>}

              <div className="studio-btn-row">
                <button onClick={() => handleSave('DRAFT')} disabled={isSaving} className="studio-cta studio-cta--ghost">Save Draft</button>
                <button onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="studio-cta">
                  {isSaving ? <Loader2 size={18} className="scout-spin" /> : <CheckCircle2 size={18} />}
                  {' '}Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {createdCard && <CardSuccessScreen card={createdCard} lockedLabel="Trim Locked" onDone={onDone} />}
      </div>
    </div>
  );
};

export default VideoCardStudio;
