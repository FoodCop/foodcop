import { useState } from 'react';

interface OnboardingData {
  displayName: string;
  location: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
}

interface CuisineStepProps {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  canGoBack: boolean;
}

const CUISINE_OPTIONS = [
  { id: 'american', label: '🍔 American' },
  { id: 'italian', label: '🍝 Italian' },
  { id: 'mexican', label: '🌮 Mexican' },
  { id: 'chinese', label: '🥡 Chinese' },
  { id: 'japanese', label: '🍱 Japanese' },
  { id: 'thai', label: '🍜 Thai' },
  { id: 'indian', label: '🍛 Indian' },
  { id: 'mediterranean', label: '🥙 Mediterranean' },
  { id: 'french', label: '🥐 French' },
  { id: 'korean', label: '🍲 Korean' },
  { id: 'vietnamese', label: '🍲 Vietnamese' },
  { id: 'greek', label: '🥗 Greek' },
];

export function CuisineStep({ data, onNext, onPrev, onUpdateData, canGoBack }: CuisineStepProps) {
  const [selected, setSelected] = useState<string[]>(data.cuisinePreferences || []);

  const toggleOption = (optionId: string) => {
    setSelected(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleNext = () => {
    onUpdateData({ cuisinePreferences: selected });
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-3xl sm:text-4xl mb-4">🌍</div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
          What cuisines do you love?
        </h2>
        <p className="text-gray-600 text-sm">
          Select your favorite cuisines to personalize your feed
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
        {CUISINE_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              selected.includes(option.id)
                ? 'border-[#F14C35] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium text-gray-900">{option.label}</div>
              {selected.includes(option.id) && (
                <div className="text-[#F14C35] text-sm mt-1">✓</div>
              )}
            </div>
          </button>
        ))}
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
          disabled={selected.length === 0}
          className="flex-1 px-6 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
