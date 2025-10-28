interface OnboardingData {
  displayName: string;
  location: string;
}

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
}

export function CompletionStep({ data, onComplete }: CompletionStepProps) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl md:text-6xl mb-6">🎉</div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">You're all set, {data.displayName}!</h2>
      <p className="text-gray-600 mb-6">
        Welcome to the FUZO community! We've personalized your experience based on your location in {data.location}.
      </p>
      
      <div className="bg-orange-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-orange-800 mb-2">🚀 What's next?</h3>
        <ul className="text-sm text-orange-700 space-y-1 text-left">
          <li>• Discover restaurants near you</li>
          <li>• Save your favorite dishes to your plate</li>
          <li>• Get personalized food recommendations</li>
          <li>• Connect with other food lovers</li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        className="w-full px-6 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl"
      >
        Enter FUZO Dashboard 🍜
      </button>
    </div>
  );
}