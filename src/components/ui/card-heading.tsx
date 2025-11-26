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
    sm: 'text-card-heading-sm',      // 18px
    md: 'text-card-heading-md',       // 20px
    lg: 'text-card-heading-lg',       // 32px
  };

  const fontSizeMap = {
    sm: '1.125rem',  // 18px
    md: '1.25rem',   // 20px
    lg: '2rem',      // 32px
  };

  const lineHeightMap = {
    sm: '1.5',       // 27px for 18px font
    md: '1.4',       // 28px for 20px font
    lg: '1.25',      // 40px for 32px font
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
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    lineClamp ? lineClampClasses[lineClamp] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component 
      className={classes}
      style={{ 
        fontFamily: "'Noto Serif Display', serif",
        fontSize: fontSizeMap[size],
        lineHeight: lineHeightMap[size]
      }}
    >
      {children}
    </Component>
  );
}

