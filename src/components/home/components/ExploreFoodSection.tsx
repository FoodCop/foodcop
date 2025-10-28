import React from 'react';
import { FuzoCard } from './FuzoCard';
import { FuzoButton } from './FuzoButton';
import { PhoneFan } from './PhoneFan';

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
                  Whether you're looking for the perfect lunch spot around the corner or planning a food adventure in a distant city, Tako is here to guide your journey.
                </p>

              </div>
              <div className="relative">
                <PhoneFan
                  leftImage="https://images.unsplash.com/photo-1760985174940-8ab7c193aba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZm9vZCUyMGRpc2NvdmVyeXxlbnwxfHx8fDE3NjE1MzMxNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  centerImage="https://images.unsplash.com/photo-1524584830732-b69165ddba9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwbWFya2V0fGVufDF8fHx8MTc2MTQ5OTQwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  rightImage="https://images.unsplash.com/photo-1553701275-1d6118df60bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwbWVudSUyMHZhcmlldHl8ZW58MXx8fHwxNzYxNTMzMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  altText="Food exploration"
                />
              </div>
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}