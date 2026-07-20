'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
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
const FAMILY_ORDER: { family: FoodCardFamily; label: string }[] = [
  { family: 'recipe', label: 'Recipe' },
  { family: 'restaurant', label: 'Restaurant' },
  { family: 'video', label: 'Video' },
  { family: 'discovery', label: 'Discovery' },
];

interface CreateCardModalProps {
  onClose: () => void;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({ onClose }) => {
  const router = useRouter();
  const [cardType, setCardType] = useState<FoodCardType | null>(null);

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

  return (
    <div role="dialog" aria-modal="true" className="studio-modal">
      <header className="studio-header">
        <div>
          <span className="studio-header__eyebrow">FUZO Studio</span>
          <h1 className="studio-header__title">Create a Card</h1>
        </div>
        <button onClick={onClose} aria-label="Close" className="studio-close">
          <X size={22} />
        </button>
      </header>

      <div className="studio-body studio-body--scroll">
        <div className="studio-type-groups">
          {FAMILY_ORDER.map(({ family, label }) => {
            const types = FOOD_CARD_TYPES.filter((t) => TYPE_META[t].family === family);
            return (
              <div key={family}>
                <span className="studio-type-group__label">{label}</span>
                <div className="studio-type-grid">
                  {types.map((type) => {
                    const meta = TYPE_META[type];
                    return (
                      <button key={type} onClick={() => setCardType(type)} className="studio-type-card">
                        <span className="studio-type-card__emoji">{meta.emoji}</span>
                        <span className="studio-type-card__label">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreateCardModal;
