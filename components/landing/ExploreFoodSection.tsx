import { ImageWithFallback } from "../figma/ImageWithFallback";
import { FuzoCard } from "../global/FuzoCard";

interface ExploreFoodSectionProps {
  onNavigateToSignup?: () => void;
}

export function ExploreFoodSection({
  onNavigateToSignup,
}: ExploreFoodSectionProps) {
  return (
    <section className="bg-gradient-to-br from-[#FFD74A] to-[#F14C35] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <FuzoCard background="yellow" className="max-w-4xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A]">
                  Explore near & far
                </h2>
                <p className="text-xl text-[#0B1F3A]/80 leading-relaxed">
                  Lunch around the corner or a weekend crawl across town—find
                  the right spot, right now. Save, navigate and go.
                </p>

                <button
                  onClick={onNavigateToSignup}
                  className="group relative px-8 py-4 bg-[#F14C35] text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  onMouseOver={(e) => {
                    const target = e.currentTarget;
                    target.style.transform = "scale(1.05)";
                    target.style.boxShadow =
                      "0 12px 32px rgba(241, 76, 53, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    const target = e.currentTarget;
                    target.style.transform = "scale(1)";
                    target.style.boxShadow =
                      "0 8px 24px rgba(241, 76, 53, 0.3)";
                  }}
                >
                  Explore the map
                  <div className="absolute inset-0 rounded-xl ring-2 ring-[#F14C35]/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
                </button>
              </div>
              <div className="relative">
                <div className="relative z-10">
                  <ImageWithFallback
                    src="/images/landing/Images/tako_pic.png"
                    alt="Tako pointing"
                    className="w-full h-auto max-w-sm mx-auto rounded-2xl"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-[#F14C35] text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce">
                  👉 This way!
                </div>
              </div>
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}
