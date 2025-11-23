import React from 'react';

interface CardHeadingProps {
  children: React.ReactNode;
  variant?: 'default' | 'overlay' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'semibold' | 'bold';
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
  lineClamp?: 1 | 2 | 3;
}

/**
 * CardHeading Component
 * Unified heading component for all card types across the application.
 * Ensures consistent styling and makes color scheme customization easier.
 */
export function CardHeading({
  children,
  variant = 'default',
  size = 'md',
  weight = 'bold',
  className = '',
  as: Component = 'h3',
  lineClamp,
}: CardHeadingProps) {
  const variantClasses = {
    default: 'text-[#1A1A1A]',
    overlay: 'text-white',
    accent: 'text-[#3D2817]', // Dark chocolate brown for card headings
  };

  const sizeClasses = {
    sm: 'text-sm',      // 14px (reduced from 18px)
    md: 'text-base',    // 16px (reduced from 20px)
    lg: 'text-lg',      // 18px (reduced from 24px)
  };

  const weightClasses = {
    normal: 'font-normal',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const lineClampClasses = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
  };

  const classes = [
    'font-serif', // Use Georgia for all headings
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    lineClamp ? lineClampClasses[lineClamp] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Component className={classes}>{children}</Component>;
}

