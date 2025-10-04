"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Placeholder for logo - replace with actual logo path
const LOGO_IMAGE = "/images/fuzo-logo.png";
const LOGO_BORDER = "/images/fuzo-border.svg";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function SplashScreen({ 
  onComplete, 
  duration = 2000,
  className 
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-primary flex items-center justify-center ${className || ""}`}>
      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <div className="relative mb-8">
          {/* White background circle */}
          <div className="w-[180px] h-[180px] bg-white rounded-full overflow-hidden relative">
            {/* Logo Image - using fallback if image doesn't exist */}
            <div className="w-[264px] h-[264px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                <span className="text-white text-6xl font-bold">F</span>
              </div>
            </div>
          </div>
          
          {/* Border overlay - using CSS border as fallback */}
          <div className="absolute inset-0 w-[200px] h-[200px] -m-[10px] border-4 border-white rounded-full opacity-80" />
        </div>

        {/* FUZO Text */}
        <h1 className="text-primary-foreground text-[28px] font-bold leading-[1.3] tracking-wider font-['DM_Sans',_sans-serif]">
          FUZO
        </h1>
      </div>
    </div>
  );
}

// Alternative version with original Figma assets (when available)
export function SplashScreenOriginal({ 
  onComplete, 
  duration = 2000,
  className 
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-primary ${className || ""}`}>
      <div className="relative w-full h-full">
        {/* Logo Container - Exact Figma positioning */}
        <div 
          className="absolute bg-white overflow-hidden rounded-[300px] w-[180px] h-[180px]" 
          style={{ 
            top: "calc(50% - 96px)", 
            left: "calc(50% - 0.5px)",
            transform: "translate(-50%, -50%)"
          }}
        >
          <div 
            className="absolute w-[264px] h-[264px]" 
            style={{ 
              top: "calc(50% - 1px)",
              left: "50%", 
              transform: "translate(-50%, -50%)"
            }}
          >
            {/* Fallback gradient if original image not available */}
            <div className="w-full h-full bg-gradient-to-br from-[#ff6b35] to-[#f7931e] rounded-full flex items-center justify-center">
              <span className="text-white text-6xl font-bold">F</span>
            </div>
          </div>
        </div>

        {/* Border - Exact Figma positioning */}
        <div 
          className="absolute w-[200px] h-[200px] border-4 border-white rounded-full opacity-80" 
          style={{ 
            top: "calc(50% - 96px)", 
            left: "calc(50% - 0.5px)",
            transform: "translate(-50%, -50%)"
          }}
        />

        {/* FUZO Text - Exact Figma positioning */}
        <p 
          className="absolute text-white text-[28px] font-bold leading-[1.3] text-center whitespace-nowrap font-['DM_Sans',_sans-serif]"
          style={{ 
            top: "425px",
            left: "calc(50% - 0.5px)",
            transform: "translateX(-50%)"
          }}
        >
          FUZO
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;