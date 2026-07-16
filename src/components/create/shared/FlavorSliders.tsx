import React from 'react';
import { FLAVOR_AXES, type FlavorVector } from '@/lib/types/foodCard';

interface FlavorSlidersProps {
  value: FlavorVector;
  onChange: (next: FlavorVector) => void;
}

// Shared 10-axis flavor slider grid, used by every Create Card studio's
// Review step - flavor_profile is now written for every card type (see
// foodCardService.createFoodCard), not just recipes. Also embedded inside
// ScoutAddPinModal's Flavor & Tags step (Restaurant family), so these classes
// need to read fine against both `.studio-panel` and `.scout-wizard__panel`.
export const FlavorSliders: React.FC<FlavorSlidersProps> = ({ value, onChange }) => {
  return (
    <div className="studio-flavor-grid">
      {FLAVOR_AXES.map((axis) => (
        <div key={axis} className="studio-flavor-row">
          <div className="studio-flavor-row__head">
            <span>{axis}</span>
            <span className="studio-flavor-row__value">{value[axis]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={value[axis]}
            onChange={(e) => onChange({ ...value, [axis]: Number(e.target.value) })}
            className="studio-flavor-row__slider"
          />
        </div>
      ))}
    </div>
  );
};

export default FlavorSliders;
