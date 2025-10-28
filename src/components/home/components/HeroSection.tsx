import { ImageWithFallback } from '../../ui/image-with-fallback';

// Placeholder images - replace with actual asset paths when available
const takoMascotImage = "/api/placeholder/400/400";
const heroBackgroundImage = "/api/placeholder/1200/800";

interface HeroSectionProps {
  onNavigateToSignup?: () => void;
}

export function HeroSection({ onNavigateToSignup }: HeroSectionProps) {
  const scrollToFeatures = () => {
    const featuresSection = document.querySelector('[data-section="features"]');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${heroBackgroundImage})`
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-[#0B1F3A] leading-tight">
                Welcome to <span className="text-[#F14C35]">FUZO</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-lg text-center">
                Discover, cook, and share amazing food adventures with Tako, your friendly food companion. Join our community of food lovers today!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onNavigateToSignup}
                className="px-8 py-4 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 text-center flex items-center justify-center gap-2"
              >
                🚀 Start Your Food Journey
              </button>
              <button 
                onClick={scrollToFeatures}
                className="px-8 py-4 border-2 border-[#F14C35] text-[#F14C35] rounded-xl hover:bg-[#F14C35] hover:text-white transition-all duration-200 font-medium text-lg"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <ImageWithFallback
                src={takoMascotImage}
                alt="Tako mascot illustration"
                className="w-full h-auto max-w-md mx-auto rounded-3xl shadow-2xl"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FFD74A] rounded-full opacity-20"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#F14C35] rounded-full opacity-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}