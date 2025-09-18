import { ImageWithFallback } from "../figma/ImageWithFallback";

interface TakoBuddySectionProps {
  onNavigateToSignup?: () => void;
}

export function TakoBuddySection({
  onNavigateToSignup,
}: TakoBuddySectionProps) {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A]">
                Meet Tako, your food buddy
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Ask for a quick tip, a must-order dish or the best time to go.
                Tako only talks food—off-topic? It'll point you to the right
                place and bring the chat back to eats.
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
                Chat with Tako
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#F14C35]/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <ImageWithFallback
                src="/images/landing/Images/tako_pic.png"
                alt="Tako mascot standing pose"
                className="w-full h-auto max-w-md mx-auto rounded-3xl"
              />
            </div>
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#FFD74A] rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#F14C35] rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
