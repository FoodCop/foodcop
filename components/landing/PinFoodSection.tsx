import { useRef } from "react";
import { PhoneFan } from "./PhoneFan";

interface PinFoodSectionProps {
  onNavigateToSignup?: () => void;
  leftSrc?: string;
  centerSrc?: string;
  rightSrc?: string;
}

export function PinFoodSection({
  onNavigateToSignup,
  leftSrc = "/img/screen-left.jpg",
  centerSrc = "/img/screen-center.jpg",
  rightSrc = "/img/screen-right.jpg",
}: PinFoodSectionProps) {
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-yellow-100 to-orange-100 relative"
      style={{ position: "relative" }} // Ensure non-static position for Framer Motion
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image with animated pins */}
            <PhoneFan
              containerRef={sectionRef}
              leftSrc={leftSrc}
              centerSrc={centerSrc}
              rightSrc={rightSrc}
              className="min-h-[600px]"
            />

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
