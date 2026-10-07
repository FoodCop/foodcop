'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ChefHat, Clapperboard, Compass, UtensilsCrossed, X, type LucideIcon } from 'lucide-react';
import { FOOD_CARD_TYPES, TYPE_META, type FoodCardFamily, type FoodCardType } from '@/lib/types/foodCard';
import { ScoutAddPinModal } from '@/components/scout/ScoutAddPinModal';
import { RecipeCardStudio } from './RecipeCardStudio';
import { VideoCardStudio } from './VideoCardStudio';
import { DiscoveryCardStudio } from './DiscoveryCardStudio';

// Master "Create Card" start screen — the new entry point for all UGC.
// Step 0 is the 12-type grid grouped into 4 families (port of
// fuzo-food-card-demo.html's type-grid). Selecting a type mounts the family
// studio that owns that card_type; each studio calls back onCreated()/onClose()
// the same way, so this component doesn't need to know their internals.
const FAMILY_ORDER: { family: FoodCardFamily; label: string; sub: string; Icon: LucideIcon }[] = [
  { family: 'recipe', label: 'Recipe', sub: 'Something you cooked, baked or mixed', Icon: ChefHat },
  { family: 'restaurant', label: 'Restaurant', sub: 'A place you ate at, pinned on the map', Icon: UtensilsCrossed },
  { family: 'video', label: 'Video', sub: 'A short clip of your food', Icon: Clapperboard },
  { family: 'discovery', label: 'Discovery', sub: 'Reviews, finds, tips and lists', Icon: Compass },
];

interface CreateCardModalProps {
  onClose: () => void;
  /** Skip the family picker and jump straight into one family's studio - used
   * by an empty-state's "Add a recipe/place/video/post" CTA, which already
   * knows what the user wants to create. Auto-selects the type outright when
   * the family only has one (video), otherwise narrows step 0's grid to just
   * that family's types. */
  initialFamily?: FoodCardFamily;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({ onClose, initialFamily }) => {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const familyTypes = initialFamily ? FOOD_CARD_TYPES.filter((t) => TYPE_META[t].family === initialFamily) : null;
  const [cardType, setCardType] = useState<FoodCardType | null>(
    familyTypes && familyTypes.length === 1 ? familyTypes[0] : null,
  );

  // Escape closes the picker (the studios own their own steps once open).
  useEffect(() => {
    if (cardType) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cardType, onClose]);

  if (cardType) {
    const family = TYPE_META[cardType].family;
    const onCreated = () => { /* studio shows its own success screen; nothing extra to do here */ };
    // The success screen's own "Done"/"Back to Scout" button - distinct from
    // the X close button, which should just cancel out with no navigation.
    // Closing the modal alone left the user on whatever page they started
    // from with no way to actually see the card they just made.
    const onDone = (destination: string) => { onClose(); router.push(destination); };

    if (family === 'restaurant') {
      return <ScoutAddPinModal cardType={cardType} onClose={onClose} onSuccess={() => onDone('/scout')} />;
    }
    if (family === 'recipe') {
      return <RecipeCardStudio cardType={cardType} onClose={onClose} onCreated={onCreated} onDone={() => onDone('/profile?activity=recipes')} />;
    }
    if (family === 'video') {
      return <VideoCardStudio cardType={cardType} onClose={onClose} onCreated={onCreated} onDone={() => onDone('/profile?activity=videos')} />;
    }
    return <DiscoveryCardStudio cardType={cardType} onClose={onClose} onCreated={onCreated} onDone={() => onDone('/profile?activity=posts')} />;
  }

  const families = initialFamily ? FAMILY_ORDER.filter((f) => f.family === initialFamily) : FAMILY_ORDER;
  const title = initialFamily ? `Create a ${families[0]?.label.toLowerCase()} card` : 'Create a card';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="studio-picker-title" className="studio-modal">
      <header className="studio-header studio-header--picker">
        <div className="studio-header__titles">
          <span className="studio-header__eyebrow">FUZO Studio</span>
          <h1 id="studio-picker-title" className="studio-header__title">{title}</h1>
          <p className="studio-header__sub">Pick what you want to share.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="studio-close">
          <X size={20} />
        </button>
      </header>

      <div className="studio-body studio-body--scroll">
        <div className="studio-type-groups">
          {families.map(({ family, label, sub, Icon }, index) => {
            const types = FOOD_CARD_TYPES.filter((t) => TYPE_META[t].family === family);
            return (
              <motion.section
                key={family}
                className="studio-type-group"
                aria-labelledby={`studio-family-${family}`}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="studio-type-group__head">
                  <span className="studio-type-group__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2.1} />
                  </span>
                  <div>
                    <h2 id={`studio-family-${family}`} className="studio-type-group__label">{label}</h2>
                    <p className="studio-type-group__sub">{sub}</p>
                  </div>
                </div>
                <div className="studio-type-grid">
                  {types.map((type) => {
                    const meta = TYPE_META[type];
                    return (
                      <button key={type} type="button" onClick={() => setCardType(type)} className="studio-type-card">
                        <span className="studio-type-card__emoji" aria-hidden="true">{meta.emoji}</span>
                        <span className="studio-type-card__label">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreateCardModal;
