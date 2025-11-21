import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ImageWithFallback } from '../../ui/image-with-fallback';

interface PhoneFanProps {
  /** Image URL for the left phone screen */
  leftImage: string;
  /** Image URL for the center phone screen */
  centerImage: string;
  /** Image URL for the right phone screen */
  rightImage: string;
  /** Alt text for accessibility */
  altText?: string;
}

export function PhoneFan({ 
  leftImage, 
  centerImage, 
  rightImage, 
  altText = "Phone screen preview" 
}: PhoneFanProps) {
  const containerRef = useRef(null);
  
  // Track scroll progress of this component
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"] // Start when entering viewport, end when leaving
  });

  // Transform scroll progress to rotation values
  const leftRotation = useTransform(scrollYProgress, [0, 0.5, 1], [0, -15, -15]);
  const rightRotation = useTransform(scrollYProgress, [0, 0.5, 1], [0, 15, 15]);
  
  // Transform scroll progress to Y position for center phone
  const centerY = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, 0]);

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto py-8 md:py-12">
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-end justify-center">
        
        {/* Left Phone - Rotated counterclockwise based on scroll */}
        <motion.div
          style={{ 
            rotate: leftRotation,
            transformOrigin: 'bottom center',
            position: 'relative'
          }}
          className="absolute z-10"
        >
          <PhoneMockup image={leftImage} altText={`${altText} - left`} />
        </motion.div>

        {/* Center Phone - Moves up based on scroll */}
        <motion.div
          style={{
            y: centerY,
            position: 'relative'
          }}
          className="relative z-20"
        >
          <PhoneMockup image={centerImage} altText={`${altText} - center`} />
        </motion.div>

        {/* Right Phone - Rotated clockwise based on scroll */}
        <motion.div
          style={{
            rotate: rightRotation,
            transformOrigin: 'bottom center',
            position: 'relative'
          }}
          className="absolute z-10"
        >
          <PhoneMockup image={rightImage} altText={`${altText} - right`} />
        </motion.div>
      </div>
    </div>
  );
}

interface PhoneMockupProps {
  image: string;
  altText: string;
}

function PhoneMockup({ image, altText }: PhoneMockupProps) {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative w-40 h-80 md:w-[200px] md:h-[400px] lg:w-60 lg:h-[480px] 
                      bg-[#0B1F3A] rounded-4xl md:rounded-[40px] p-2 md:p-3 
                      shadow-2xl border-4 border-[#0B1F3A]">
        
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 
                        bg-[#0B1F3A] rounded-b-2xl z-20"></div>
        
        {/* Screen */}
        <div className="relative w-full h-full bg-white rounded-3xl md:rounded-4xl overflow-hidden">
          <ImageWithFallback
            src={image}
            alt={altText}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 
                        w-16 md:w-20 h-1 md:h-1.5 bg-gray-300 rounded-full"></div>
      </div>
      
      {/* Phone Shadow */}
      <div className="absolute inset-0 rounded-4xl md:rounded-[40px] 
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"></div>
    </div>
  );
}