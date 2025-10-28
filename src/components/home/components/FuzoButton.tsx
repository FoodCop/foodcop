import React from 'react';
import { cn } from '../../ui/utils';

interface FuzoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function FuzoButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: FuzoButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#F14C35] hover:bg-[#D63E2A] text-white shadow-lg hover:shadow-xl focus:ring-[#F14C35]",
    secondary: "bg-white hover:bg-gray-50 text-[#F14C35] border-2 border-[#F14C35] shadow-md hover:shadow-lg focus:ring-[#F14C35]",
    tertiary: "bg-transparent hover:bg-[#F14C35]/10 text-[#F14C35] focus:ring-[#F14C35]"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}