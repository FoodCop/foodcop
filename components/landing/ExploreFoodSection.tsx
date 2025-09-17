import { ImageWithFallback } from "../figma/ImageWithFallback";
import { FuzoCard } from "../global/FuzoCard";

export function ExploreFoodSection() {
  return (
    <section className="bg-gradient-to-br from-[#FFD74A] to-[#F14C35] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <FuzoCard background="yellow" className="max-w-4xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A]">
                  Explore Food Near & Far
                </h2>
                <p className="text-lg text-[#0B1F3A]/80">
                  Whether you're looking for the perfect lunch spot around the
                  corner or planning a food adventure in a distant city, Tako is
                  here to guide your journey.
                </p>
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
