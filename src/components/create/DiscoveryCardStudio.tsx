'use client';

import React, { useRef, useState } from 'react';
import { X, Star, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { StudioStepper } from '@/components/ui/StudioStepper';
import { NeuralReveal } from '@/components/ui/NeuralReveal';
import { loadUploadedImage, parseAiJson } from '@/lib/utils/studioHelpers';
import { GeminiService } from '@/lib/services/geminiService';
import { foodCardService } from '@/lib/services/foodCardService';
import { FlavorSliders } from './shared/FlavorSliders';
import { TagChips } from './shared/TagChips';
import { Dropzone } from './shared/Dropzone';
import { CardSuccessScreen } from './shared/CardSuccessScreen';
import { DEFAULT_FLAVOR, emptyCardTags, TYPE_META, type FoodCardType, type FlavorVector, type CardTags, type FoodCardRecord } from '@/lib/types/foodCard';

// The lightest of the four Create Card families: FOOD_REVIEW,
// FOOD_EXPLORATION, FOOD_RECOMMENDATION, FOOD_COLLECTION all share this exact
// step sequence - only the header copy differs by cardType. No location step
// (that's what distinguishes Discovery from the Restaurant family).
const STUDIO_STEPS = ['Source', 'Story', 'Reveal', 'Review'];

interface DiscoveryCardStudioProps {
  cardType: FoodCardType;
  onClose: () => void;
  onCreated: () => void;
  onDone: () => void;
}

export const DiscoveryCardStudio: React.FC<DiscoveryCardStudioProps> = ({ cardType, onClose, onCreated, onDone }) => {
  const meta = TYPE_META[cardType];
  const [currentStep, setCurrentStep] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<CardTags>(emptyCardTags());
  const [flavorProfile, setFlavorProfile] = useState<FlavorVector>(DEFAULT_FLAVOR);
  const [isSaving, setIsSaving] = useState(false);
  const [createdCard, setCreatedCard] = useState<FoodCardRecord | null>(null);

  const mountedRef = useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleFile = async (file: File) => {
    await loadUploadedImage(file, setImage, () => {});
  };

  const runAnalysis = async () => {
    try {
      const raw = await GeminiService.analyzeCard(cardType, caption, image || undefined);
      const parsed = parseAiJson(raw) || {};
      if (!mountedRef.current) return;
      setTitle((prev) => prev || parsed.title || '');
      setCaption((prev) => prev || parsed.caption || '');
      if (parsed.cuisine) {
        setTags((prev) => (prev.cuisine.includes(parsed.cuisine) ? prev : { ...prev, cuisine: [...prev.cuisine, parsed.cuisine] }));
      }
      if (Array.isArray(parsed.tags)) {
        setTags((prev) => ({ ...prev, food_type: [...new Set([...prev.food_type, ...parsed.tags])] }));
      }
      if (parsed.flavor_profile) {
        setFlavorProfile((prev) => ({ ...prev, ...parsed.flavor_profile }));
      }
    } catch (error) {
      console.warn('Discovery card neural analysis failed:', error);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    try {
      const result = await foodCardService.createFoodCard(
        {
          cardType,
          title: title || meta.label,
          caption,
          tags,
          flavorProfile,
          imageUrl: image || undefined,
        },
        status,
      );
      if (result.success && result.data) {
        setCreatedCard(result.data);
        onCreated();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="studio-modal">
      <header className="studio-header">
        <StudioStepper steps={STUDIO_STEPS} currentStep={currentStep} />
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
                <h2 className="studio-heading">Add a Photo</h2>
                <p className="studio-sub">Optional — you can also just describe it.</p>
              </div>

              {image ? (
                <div className="studio-photo-square">
                  <img src={image} alt="" />
                  <button onClick={() => setImage(null)} className="studio-photo-square__remove">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <Dropzone accept="image/*" onFile={handleFile}>
                  <ImageIcon size={36} />
                  <span className="studio-dropzone__label">Upload or Drop a Photo</span>
                </Dropzone>
              )}

              <div className="studio-btn-row">
                <button onClick={() => setCurrentStep(1)} className="studio-cta studio-cta--ghost">
                  Skip
                </button>
                <button onClick={() => setCurrentStep(1)} disabled={!image} className="studio-cta">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="studio-panel">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Story</span>
                <h2 className="studio-heading">Tell It</h2>
              </div>
              <div className="studio-panel__group">
                <div className="studio-rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} className="studio-rating__star" onClick={() => setRating(s === rating ? 0 : s)}>
                      <Star size={32} fill={s <= rating ? '#f2a93b' : 'none'} style={{ color: s <= rating ? '#f2a93b' : '#292524' }} />
                    </button>
                  ))}
                </div>
                <textarea
                  autoFocus
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe the discovery..."
                  className="studio-textarea"
                />
              </div>
              <button
                onClick={() => { setCurrentStep(2); runAnalysis(); }}
                disabled={caption.length < 5}
                className="studio-cta"
              >
                Neural Sync
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && <NeuralReveal onNext={() => setCurrentStep(3)} />}

        {currentStep === 3 && !createdCard && (
          <div className="studio-panel--scroll">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Review</span>
                <h2 className="studio-heading">{meta.emoji} {meta.label}</h2>
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a title..."
                className="studio-input"
              />

              <TagChips value={tags} onChange={setTags} categories={['cuisine', 'meal_type', 'diet']} />
              <FlavorSliders value={flavorProfile} onChange={setFlavorProfile} />

              <div className="studio-btn-row">
                <button onClick={() => handleSave('DRAFT')} disabled={isSaving} className="studio-cta studio-cta--ghost">
                  Save Draft
                </button>
                <button onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="studio-cta">
                  {isSaving ? <Loader2 size={18} className="scout-spin" /> : <CheckCircle2 size={18} />}
                  {' '}Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {createdCard && <CardSuccessScreen card={createdCard} lockedLabel="Card Locked" onDone={onDone} />}
      </div>
    </div>
  );
};

export default DiscoveryCardStudio;
