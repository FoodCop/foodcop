import { useState } from 'react';

interface OnboardingData {
  displayName: string;
  location: string;
  dietaryRestrictions: string[];
}

interface DietaryStepProps {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  canGoBack: boolean;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '🥗 Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', label: '🌱 Vegan', description: 'No animal products' },
  { id: 'pescatarian', label: '🐟 Pescatarian', description: 'No meat except fish' },
  { id: 'gluten-free', label: '🌾 Gluten-Free', description: 'No gluten' },
  { id: 'dairy-free', label: '🥛 Dairy-Free', description: 'No dairy products' },
  { id: 'nut-free', label: '🥜 Nut-Free', description: 'No nuts or nut products' },
  { id: 'halal', label: '☪️ Halal', description: 'Islamic dietary laws' },
  { id: 'kosher', label: '✡️ Kosher', description: 'Jewish dietary laws' },
];

export function DietaryStep({ data, onNext, onPrev, onUpdateData, canGoBack }: DietaryStepProps) {
  const [selected, setSelected] = useState<string[]>(data.dietaryRestrictions || []);

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
    onUpdateData({ dietaryRestrictions: selected });
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-3xl sm:text-4xl mb-4">🍽️</div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
          Any dietary restrictions?
        </h2>
        <p className="text-gray-600 text-sm">
          Select all that apply. You can skip this if none apply.
        </p>
      </div>

      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {DIETARY_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selected.includes(option.id)
                ? 'border-[#F14C35] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
              {selected.includes(option.id) && (
                <div className="text-[#F14C35] text-xl">✓</div>
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
          className="flex-1 px-6 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
