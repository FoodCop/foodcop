import { useState } from 'react';

interface OnboardingData {
  displayName: string;
  location: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  spiceTolerance: 'mild' | 'medium' | 'hot' | 'extreme';
  priceRange: 'budget' | 'moderate' | 'expensive' | 'fine_dining';
}

interface PreferencesStepProps {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  canGoBack: boolean;
}

const SPICE_OPTIONS: Array<{ id: 'mild' | 'medium' | 'hot' | 'extreme'; label: string; description: string }> = [
  { id: 'mild', label: '😊 Mild', description: 'Keep it gentle' },
  { id: 'medium', label: '🌶️ Medium', description: 'Some heat is nice' },
  { id: 'hot', label: '🔥 Hot', description: 'Bring the spice!' },
  { id: 'extreme', label: '💀 Extreme', description: 'Nuclear level' },
];

const PRICE_OPTIONS: Array<{ id: 'budget' | 'moderate' | 'expensive' | 'fine_dining'; label: string; description: string }> = [
  { id: 'budget', label: '💵 Budget', description: '$-$$' },
  { id: 'moderate', label: '💰 Moderate', description: '$$-$$$' },
  { id: 'expensive', label: '💎 Expensive', description: '$$$-$$$$' },
  { id: 'fine_dining', label: '👑 Fine Dining', description: '$$$$+' },
];

export function PreferencesStep({ data, onNext, onPrev, onUpdateData, canGoBack }: PreferencesStepProps) {
  const [spiceTolerance, setSpiceTolerance] = useState<'mild' | 'medium' | 'hot' | 'extreme'>(
    data.spiceTolerance || 'medium'
  );
  const [priceRange, setPriceRange] = useState<'budget' | 'moderate' | 'expensive' | 'fine_dining'>(
    data.priceRange || 'moderate'
  );

  const handleNext = () => {
    onUpdateData({ spiceTolerance, priceRange });
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-3xl sm:text-4xl mb-4">⚙️</div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
          Set your preferences
        </h2>
        <p className="text-gray-600 text-sm">
          Help us tailor your experience
        </p>
      </div>

      <div className="space-y-6 mb-6">
        {/* Spice Tolerance */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Spice Tolerance</h3>
          <div className="grid grid-cols-2 gap-2">
            {SPICE_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setSpiceTolerance(option.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  spiceTolerance === option.id
                    ? 'border-[#F14C35] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRICE_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setPriceRange(option.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  priceRange === option.id
                    ? 'border-[#F14C35] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {canGoBack && (
          <button
            onClick={onPrev}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
