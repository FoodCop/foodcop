interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl md:text-6xl mb-6">🍜</div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">Welcome to FUZO!</h2>
      <p className="text-gray-600 mb-8">
        We're excited to have you join our food community! Let's get you set up with a personalized experience.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        This will only take a minute, and you can always update your preferences later.
      </p>
      <button
        onClick={onNext}
        className="w-full px-6 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl"
      >
        Let's Get Started! 🚀
      </button>
    </div>
  );
}