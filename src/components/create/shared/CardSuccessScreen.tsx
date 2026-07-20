import React from 'react';
import { Check } from 'lucide-react';
import { TYPE_META, type FoodCardRecord } from '@/lib/types/foodCard';

interface CardSuccessScreenProps {
  card: FoodCardRecord;
  lockedLabel: string;
  onDone: () => void;
}

// Shown when a studio finishes saving — renders the card that was actually
// created (image, title, type badge, top tags) instead of a generic
// congratulations screen, so the user can see what they just made before
// moving on.
export const CardSuccessScreen: React.FC<CardSuccessScreenProps> = ({ card, lockedLabel, onDone }) => {
  const meta = TYPE_META[card.card_type];
  const previewTags = [...card.tags.cuisine, ...card.tags.meal_type].slice(0, 3);

  return (
    <div className="studio-success">
      <div className="studio-success__card">
        <div className="studio-success__card-face" style={{ background: meta.color }}>
          {card.image_url && <img src={card.image_url} alt="" />}
          <div className="studio-success__card-gradient" />
          <span className="studio-success__card-badge">
            <Check size={14} strokeWidth={3} /> Locked
          </span>
          <div className="studio-success__card-info">
            <span className="studio-success__card-type">{meta.emoji} {meta.label}</span>
            <h3 className="studio-success__card-title">{card.title}</h3>
            {previewTags.length > 0 && (
              <div className="studio-success__card-tags">
                {previewTags.map((tag) => (
                  <span key={tag} className="studio-success__card-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <h2 className="studio-success__heading">{lockedLabel}</h2>
      <button onClick={onDone} className="studio-success__btn">Done</button>
    </div>
  );
};

export default CardSuccessScreen;
