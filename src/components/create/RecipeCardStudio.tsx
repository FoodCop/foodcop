'use client';

import React, { useRef, useState } from 'react';
import { X, Image as ImageIcon, Loader2, CheckCircle2, Check, Plus, Trash2 } from 'lucide-react';
import { StudioStepper } from '@/components/ui/StudioStepper';
import { NeuralReveal } from '@/components/ui/NeuralReveal';
import { loadUploadedImage, parseAiJson } from '@/lib/utils/studioHelpers';
import { GeminiService } from '@/lib/services/geminiService';
import { foodCardService } from '@/lib/services/foodCardService';
import { UGC_CUISINES } from '@/lib/utils/taxonomy';
import { FlavorSliders } from './shared/FlavorSliders';
import { TagChips } from './shared/TagChips';
import { Dropzone } from './shared/Dropzone';
import { DEFAULT_FLAVOR, emptyCardTags, TYPE_META, type FoodCardType, type FlavorVector, type CardTags } from '@/lib/types/foodCard';

// Recipe family (RECIPE, HOME_COOKING, DESSERT, DRINK). Modeled on
// BITES_STUDIO_READY_RECKONER.md's 6-step wizard: Visuals -> Identity ->
// Story (description + ingredients) -> Neural Reveal -> Review -> Success.
const STUDIO_STEPS = ['Visuals', 'Identity', 'Story', 'Reveal', 'Review'];

type Nutrition = { calories?: number; protein?: number; carbs?: number; fat?: number };
type Ingredient = [string, string, string];

interface RecipeCardStudioProps {
  cardType: FoodCardType;
  onClose: () => void;
  onCreated: () => void;
}

export const RecipeCardStudio: React.FC<RecipeCardStudioProps> = ({ cardType, onClose, onCreated }) => {
  const meta = TYPE_META[cardType];
  const [currentStep, setCurrentStep] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([['', '', '']]);
  const [nutrition, setNutrition] = useState<Nutrition>({});
  const [tags, setTags] = useState<CardTags>(emptyCardTags());
  const [flavorProfile, setFlavorProfile] = useState<FlavorVector>(DEFAULT_FLAVOR);
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  const mountedRef = useRef(true);
  React.useEffect(() => () => { mountedRef.current = false; }, []);

  const handleFile = async (file: File) => {
    await loadUploadedImage(file, setImage, () => {});
  };

  const runAnalysis = async () => {
    try {
      const raw = await GeminiService.analyzeCard(cardType, description, image || undefined);
      const parsed = parseAiJson(raw) || {};
      if (!mountedRef.current) return;

      setTitle((prev) => prev || parsed.title || '');
      if (parsed.flavor_profile) setFlavorProfile((prev) => ({ ...prev, ...parsed.flavor_profile }));
      if (parsed.nutrition) setNutrition(parsed.nutrition);
      if (parsed.cuisine) {
        setCuisine((prev) => prev || parsed.cuisine);
        setTags((prev) => (prev.cuisine.includes(parsed.cuisine) ? prev : { ...prev, cuisine: [...prev.cuisine, parsed.cuisine] }));
      }
      if (Array.isArray(parsed.tags)) {
        setTags((prev) => ({ ...prev, food_type: [...new Set([...prev.food_type, ...parsed.tags])] }));
      }

      const hasUserIngredients = ingredients.some((row) => row[0]);
      if (!hasUserIngredients && Array.isArray(parsed.ingredients) && parsed.ingredients.length) {
        setIngredients(parsed.ingredients.map((row: string[]) => [row[0] || '', row[1] || '', row[2] || '']));
      }
    } catch (error) {
      console.warn('Recipe card neural analysis failed:', error);
    }
  };

  const addIngredient = () => setIngredients((prev) => [...prev, ['', '', '']]);
  const removeIngredient = (i: number) => setIngredients((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [['', '', '']]));
  const updateIngredient = (i: number, field: 0 | 1 | 2, val: string) =>
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? (row.map((c, ci) => (ci === field ? val : c)) as Ingredient) : row)));

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    try {
      const finalTags: CardTags = cuisine && !tags.cuisine.includes(cuisine) ? { ...tags, cuisine: [...tags.cuisine, cuisine] } : tags;
      const result = await foodCardService.createFoodCard(
        {
          cardType,
          title: title || meta.label,
          caption: description,
          tags: finalTags,
          flavorProfile,
          ingredients,
          nutrition,
          imageUrl: image || undefined,
        },
        status,
      );
      if (result.success) {
        setDone(true);
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
                <h2 className="studio-heading">Show It Off</h2>
                <p className="studio-sub">Optional — a photo helps AI guess ingredients &amp; flavor.</p>
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
                <button onClick={() => setCurrentStep(1)} className="studio-cta studio-cta--ghost">Skip</button>
                <button onClick={() => setCurrentStep(1)} disabled={!image} className="studio-cta">Next</button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="studio-panel">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Identity</span>
                <h2 className="studio-heading">Name The Dish</h2>
              </div>
              <div className="studio-panel__group">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Butter Chicken Masala"
                  className="studio-input"
                />
                <div className="studio-chip-grid">
                  {UGC_CUISINES.map((c) => (
                    <button key={c} onClick={() => setCuisine(c)} className={`studio-chip${cuisine === c ? ' is-selected' : ''}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setCurrentStep(2)} disabled={!title} className="studio-cta">
                Next: Ingredients
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="studio-panel--scroll">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Story</span>
                <h2 className="studio-heading">The Recipe</h2>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe it — what makes this special?"
                className="studio-textarea"
              />
              <div className="studio-panel__group">
                <span className="studio-tag-section__label">Ingredients (optional — AI can fill these in)</span>
                {ingredients.map((ing, i) => (
                  <div key={i} className="studio-ingredient-row">
                    <input value={ing[0]} onChange={(e) => updateIngredient(i, 0, e.target.value)} placeholder="Ingredient" className="studio-ingredient-row__name" />
                    <input value={ing[1]} onChange={(e) => updateIngredient(i, 1, e.target.value)} placeholder="Qty" className="studio-ingredient-row__qty" />
                    <input value={ing[2]} onChange={(e) => updateIngredient(i, 2, e.target.value)} placeholder="Unit" className="studio-ingredient-row__unit" />
                    <button onClick={() => removeIngredient(i)} className="studio-ingredient-row__remove"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={addIngredient} className="studio-add-row"><Plus size={16} /> Add ingredient</button>
              </div>
              <button onClick={() => { setCurrentStep(3); runAnalysis(); }} className="studio-cta">
                Neural Sync
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && <NeuralReveal onNext={() => setCurrentStep(4)} title="Neural Synthesis" subtitle="Extracting Flavor & Nutrition..." />}

        {currentStep === 4 && !done && (
          <div className="studio-panel--scroll">
            <div className="studio-panel__inner">
              <div className="studio-panel__head">
                <span className="studio-header__eyebrow">Review</span>
                <h2 className="studio-heading">{meta.emoji} {title || meta.label}</h2>
              </div>

              {(nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat) && (
                <div className="studio-nutrition-grid">
                  {([['calories', 'kcal'], ['protein', 'g'], ['carbs', 'g'], ['fat', 'g']] as const).map(([key, unit]) => (
                    <div key={key} className="studio-nutrition-item">
                      <div className="studio-nutrition-item__val">{nutrition[key] ?? 0}{unit === 'g' ? 'g' : ''}</div>
                      <div className="studio-nutrition-item__label">{key}</div>
                    </div>
                  ))}
                </div>
              )}

              {ingredients.some((row) => row[0]) && (
                <ul className="studio-ingredient-list">
                  {ingredients.filter((row) => row[0]).map((row, i) => (
                    <li key={i} className="studio-ingredient-list__item">
                      <span>{row[0]}</span>
                      <span className="studio-ingredient-list__qty">{row[1]} {row[2]}</span>
                    </li>
                  ))}
                </ul>
              )}

              <TagChips value={tags} onChange={setTags} categories={['cuisine', 'meal_type', 'diet', 'cooking_style']} />
              <FlavorSliders value={flavorProfile} onChange={setFlavorProfile} />

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

        {done && (
          <div className="studio-success">
            <div className="studio-success__icon">
              <Check size={72} strokeWidth={4} />
            </div>
            <h2 className="studio-success__heading">Card Locked</h2>
            <button onClick={onClose} className="studio-success__btn">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCardStudio;
