interface PinFoodSectionProps {
  onNavigateToSignup?: () => void;
}

export function PinFoodSection({ onNavigateToSignup }: PinFoodSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-yellow-100 to-orange-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image with animated pins */}
            <div className="relative">
              <div className="relative w-full h-80 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl overflow-hidden">
                <img
                  src="/images/landing/Images/radar.png"
                  alt="Food map with pins"
                  className="w-full h-full object-cover"
                />

                {/* Animated floating pins */}
                <div className="absolute top-8 right-8 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center text-white text-sm font-bold animate-bounce">
                  📍
                </div>
                <div
                  className="absolute top-16 left-12 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                >
                  📌
                </div>
                <div
                  className="absolute bottom-16 right-16 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs animate-pulse"
                  style={{ animationDelay: "1s" }}
                >
                  📌
                </div>
                <div
                  className="absolute bottom-8 left-8 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs animate-pulse"
                  style={{ animationDelay: "1.5s" }}
                >
                  📌
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-[#F14C35] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                📍 Map View
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
                Build your food map
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Save spots you love (and want to try). FUZO turns your saves
                into a living map with notes, quick ratings and shareable lists.
              </p>

              <button
                onClick={onNavigateToSignup}
                className="group relative px-8 py-4 bg-[#F14C35] text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onMouseOver={(e) => {
                  const target = e.currentTarget;
                  target.style.transform = "scale(1.05)";
                  target.style.boxShadow = "0 12px 32px rgba(241, 76, 53, 0.4)";
                }}
                onMouseOut={(e) => {
                  const target = e.currentTarget;
                  target.style.transform = "scale(1)";
                  target.style.boxShadow = "0 8px 24px rgba(241, 76, 53, 0.3)";
                }}
              >
                Start pinning
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#F14C35]/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
