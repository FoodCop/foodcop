import React, { useState } from 'react';
import { MessageCircle, Star, Heart, MapPin, ChefHat, HelpCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';
// import (figma asset) - DISABLED:9566fb321ba47b7b112f8b4d7803d27b9ea2dbaf.png';

interface AIAssistantDemoProps {
  onClose?: () => void;
}

export function AIAssistantDemo({ onClose }: AIAssistantDemoProps) {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demoFeatures = [
    {
      id: 'restaurant',
      title: 'Restaurant Suggestions',
      description: 'Ask Tako for nearby restaurants and get smart recommendations',
      icon: MapPin,
      color: 'bg-blue-500',
      example: 'Try: "Find me good sushi nearby"',
      response: {
        text: "I found some amazing sushi spots near you!",
        cards: [
          {
            type: 'restaurant',
            name: 'Sakura Sushi Bar',
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
            rating: 4.8,
            cuisine: 'Japanese',
            distance: '0.2 mi'
          }
        ]
      }
    },
    {
      id: 'recipe',
      title: 'Recipe Discovery',
      description: 'Get personalized recipe suggestions with step-by-step instructions',
      icon: ChefHat,
      color: 'bg-green-500',
      example: 'Try: "Show me easy pasta recipes"',
      response: {
        text: "Here are some delicious and easy pasta recipes for you!",
        cards: [
          {
            type: 'recipe',
            title: 'Creamy Tuscan Pasta',
            image: 'https://images.unsplash.com/photo-1693820206848-6ad84857832a?w=400',
            cookingTime: '25 min',
            difficulty: 'Easy'
          }
        ]
      }
    },
    {
      id: 'help',
      title: 'App Navigation Help',
      description: 'Get friendly explanations of FUZO features and how to use them',
      icon: HelpCircle,
      color: 'bg-purple-500',
      example: 'Try: "How does FUZO work?"',
      response: {
        text: "FUZO is your social food discovery platform! Let me show you around:",
        cards: [
          {
            type: 'help',
            title: 'Discover Food',
            description: 'Swipe through restaurants and save favorites to your Plate'
          },
          {
            type: 'help',
            title: 'Find Recipes',
            description: 'Browse and create amazing recipes in Bites'
          }
        ]
      }
    },
    {
      id: 'map',
      title: 'Smart Navigation',
      description: 'Get directions and route planning with contextual suggestions',
      icon: MapPin,
      color: 'bg-red-500',
      example: 'Try: "How do I get to that restaurant?"',
      response: {
        text: "I can help you navigate there! Shall I plot a course for you?",
        cards: [
          {
            type: 'map',
            restaurant: 'Sakura Sushi Bar',
            address: '123 Main St, Downtown',
            distance: '0.2 mi away'
          }
        ]
      }
    }
  ];

  const capabilities = [
    {
      icon: MessageCircle,
      title: 'Natural Conversation',
      description: 'Chat with Tako using natural language - no commands needed!'
    },
    {
      icon: Star,
      title: 'Smart Recommendations',
      description: 'Get personalized suggestions based on your preferences and location'
    },
    {
      icon: Heart,
      title: 'Social Integration',
      description: 'Save recommendations directly to your Plate and share with friends'
    },
    {
      icon: Zap,
      title: 'Instant Actions',
      description: 'Quick actions like navigation, saving, and app feature access'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F14C35]/5 to-[#A6471E]/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-[#F14C35] to-[#A6471E] p-1">
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-2">
              <ImageWithFallback
                src={takoAI}
                alt="Tako AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">Meet Tako, Your AI Food Assistant</h1>
          <p className="text-gray-600 text-lg">Discover how Tako can help you explore the world of food with FUZO</p>
        </div>

        {/* Demo Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {demoFeatures.map((feature) => {
            const IconComponent = feature.icon;
            const isActive = activeDemo === feature.id;
            
            return (
              <motion.div
                key={feature.id}
                className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all cursor-pointer ${
                  isActive ? 'border-[#F14C35] shadow-xl' : 'border-transparent hover:border-[#F14C35]/30'
                }`}
                onClick={() => setActiveDemo(isActive ? null : feature.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-700 font-medium">{feature.example}</p>
                    </div>
                  </div>
                </div>

                {/* Demo Response */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 pt-4 mt-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={takoAI}
                            alt="Tako"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-800">{feature.response.text}</p>
                          </div>
                          
                          {feature.response.cards && (
                            <div className="space-y-2">
                              {feature.response.cards.map((card: any, index: number) => (
                                <DemoCard key={index} card={card} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Capabilities */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-[#0B1F3A] text-center mb-8">AI Assistant Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((capability, index) => {
              const IconComponent = capability.icon;
              
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-[#F14C35]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-[#F14C35]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0B1F3A] mb-1">{capability.title}</h3>
                    <p className="text-gray-600 text-sm">{capability.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Food Journey?</h2>
            <p className="text-white/90 mb-6">
              Look for Tako's bubble in the bottom-right corner of any FUZO page to get started!
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-white text-[#F14C35] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Start Exploring FUZO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Card Component
function DemoCard({ card }: { card: any }) {
  if (card.type === 'restaurant') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <ImageWithFallback
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-[#0B1F3A]">{card.name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{card.rating}</span>
              </div>
              <span>•</span>
              <span>{card.cuisine}</span>
              <span>•</span>
              <span>{card.distance}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'recipe') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <ImageWithFallback
              src={card.image}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-[#0B1F3A]">{card.title}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
              <span>{card.cookingTime}</span>
              <span>•</span>
              <span>{card.difficulty}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'help') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{card.title}</h4>
        <p className="text-xs text-gray-600">{card.description}</p>
      </div>
    );
  }

  if (card.type === 'map') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm text-[#0B1F3A]">{card.restaurant}</h4>
            <p className="text-xs text-gray-600">{card.address}</p>
            <p className="text-xs text-gray-500">{card.distance}</p>
          </div>
          <div className="px-3 py-1 bg-[#F14C35] text-white rounded-lg text-xs font-medium">
            Show Route
          </div>
        </div>
      </div>
    );
  }

  return null;
}
