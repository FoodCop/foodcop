import React from 'react';
import { FuzoButton } from './FuzoButton';
import { PhoneFan } from './PhoneFan';

export function TakoBuddySection() {
  const features = [
    {
      icon: "⚡",
      title: "Power",
      description: "AI-powered recommendations based on your taste preferences and dietary needs."
    },
    {
      icon: "💡",
      title: "Innovation", 
      description: "Cutting-edge technology that learns from your food journey and suggests new experiences."
    },
    {
      icon: "🤝",
      title: "Companionship",
      description: "Your friendly guide through every culinary adventure, making food discovery fun and personal."
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A]">
                Tako – The Food Buddy
              </h2>
              <p className="text-lg text-gray-600">
                Meet Tako, your intelligent food companion who understands your taste, learns your preferences, and guides you to incredible culinary discoveries.
              </p>
            </div>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#FFD74A] rounded-xl flex items-center justify-center text-xl">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-[#0B1F3A]">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            

          </div>
          
          <div className="relative">
            <div className="relative z-10">
              <PhoneFan
                leftImage="https://images.unsplash.com/photo-1757310998437-b2e8a7bd2e97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGNoYXRib3QlMjBhc3Npc3RhbnR8ZW58MXx8fHwxNzYxNTExNTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                centerImage="https://images.unsplash.com/photo-1646766677899-9c1750e28b0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBjaGF0JTIwYXBwfGVufDF8fHx8MTc2MTUzMzE2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                rightImage="https://images.unsplash.com/photo-1753778367032-2ee16109a430?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY3RvcHVzJTIwY3V0ZSUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3NjE1MzMxNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                altText="Tako AI assistant"
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