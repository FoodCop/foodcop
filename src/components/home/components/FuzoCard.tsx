import React from 'react';
import { cn } from '../../ui/utils';

interface FuzoCardProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'yellow' | 'coral' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FuzoCard({ 
  children, 
  className, 
  background = 'white',
  padding = 'lg'
}: FuzoCardProps) {
  const baseStyles = "rounded-2xl shadow-lg";
  
  const backgrounds = {
    white: "bg-white text-[#0B1F3A]",
    yellow: "bg-[#FFD74A] text-[#0B1F3A]",
    coral: "bg-[#F14C35] text-white",
    dark: "bg-[#A6471E] text-white"
  };
  
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12"
  };
  
  return (
    <div className={cn(baseStyles, backgrounds[background], paddings[padding], className)}>
      {children}
    </div>
  );
}