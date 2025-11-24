import React from 'react';
import { FuzoCard } from './FuzoCard';
import { FuzoButton } from './FuzoButton';
import { PhoneFan } from './PhoneFan';

export function FoodStoryboardSection() {
  return (
    <section 
      className="py-20 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('./images/share_bg.jpg')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        
        <div className="flex justify-center">
          <FuzoCard background="dark" className="max-w-2xl text-center shadow-2xl">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Food Storyboard
              </h2>
              <p className="text-lg text-white/90">
                Create visual stories of your culinary journey. Document your food adventures across different cities and cultures, building a beautiful timeline of flavors and memories.
              </p>

              {/* Phone Fan Animation */}
              <PhoneFan
                leftImage="/images/share1.jpg"
                centerImage="/images/share2.jpg"
                rightImage="/images/share3.jpg"
                altText="Food stories"
              />
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}