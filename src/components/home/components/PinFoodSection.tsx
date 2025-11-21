import { FuzoCard } from './FuzoCard';
import { PhoneFan } from './PhoneFan';

export function PinFoodSection() {
  return (
    <section className="bg-[#FFD74A] py-20 relative" data-section="features" style={{ position: 'relative' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ position: 'relative' }}>
        <FuzoCard background="yellow" className="shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative" style={{ position: 'relative' }}>
              <PhoneFan
                leftImage="/images/pin1.jpg"
                centerImage="/images/pin2.jpg"
                rightImage="/images/pin3.jpg"
                altText="Saved food favorites"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#0B1F3A]">
                Pin Your Food Adventures
              </h2>
              <p className="text-lg text-[#0B1F3A]/80">
                Mark your favorite restaurants, discover hidden gems, and create your personal food map. Tako helps you remember every delicious moment and guides you to new culinary experiences.
              </p>

            </div>
          </div>
        </FuzoCard>
      </div>
    </section>
  );
}