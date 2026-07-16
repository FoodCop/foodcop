import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface NeuralRevealProps {
  onNext: () => void;
  title?: string;
  subtitle?: string;
  duration?: number;
}

/**
 * Shared Neural Reveal component for immersive UGC loading states.
 * Standardized across Snap, Bites, and Trims studios.
 */
export const NeuralReveal = ({
  onNext,
  title = "Neural Synthesis",
  subtitle = "Mapping Data Points...",
  duration = 2500
}: NeuralRevealProps) => {
  useEffect(() => {
    const timer = setTimeout(onNext, duration);
    return () => clearTimeout(timer);
  }, [onNext, duration]);

  return (
    <div className="studio-reveal">
      <Sparkles size={72} className="studio-reveal__icon" />
      <h2 className="studio-reveal__title">{title}</h2>
      <div className="studio-reveal__footer">
        <div className="studio-reveal__dots">
          {[1, 2, 3].map((i) => (
            <div key={i} className="studio-reveal__dot" />
          ))}
        </div>
        {subtitle && <p className="studio-reveal__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};
