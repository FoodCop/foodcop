import { FuzoCard } from './FuzoCard';
import { PhoneFan } from './PhoneFan';

export function CookWatchSection() {
  return (
    <section 
      className="py-20 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(11, 31, 58, 0.7), rgba(11, 31, 58, 0.7)), url('/images/cook_bg.jpg?v=2')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <FuzoCard background="yellow" className="max-w-2xl text-center shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#F14C35] rounded-full flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">👨‍🍳</span>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#0B1F3A]">
                Cook, Watch & Try
              </h2>
              <p className="text-lg text-[#0B1F3A]/80">
                Follow step-by-step cooking videos, try new recipes from around the world, and share your culinary creations with the FUZO community.
              </p>

              {/* Phone Fan Animation */}
              <PhoneFan
                leftImage="/images/cook1.jpg"
                centerImage="/images/cook2.jpg"
                rightImage="/images/cook3.jpg"
                altText="FUZO cooking recipes"
              />
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}