import { useState } from 'react';

interface OnboardingData {
  displayName: string;
  location: string;
}

interface ProfileStepProps {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  canGoBack: boolean;
}

export function ProfileStep({ data, onNext, onPrev, onUpdateData, canGoBack }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState(data.displayName);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    onUpdateData({ displayName: displayName.trim() });
    onNext();
  };

  const handleInputChange = (value: string) => {
    setDisplayName(value);
    if (error) setError('');
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-3xl sm:text-4xl mb-4">👋</div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">What should we call you?</h2>
        <p className="text-gray-600">
          This will be displayed on your profile and when you interact with the community.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter your name"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
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
    </div>
  );
}