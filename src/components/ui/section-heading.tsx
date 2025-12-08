import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}

/**
 * SectionHeading Component
 * Unified component for section headings like "My Crew", "Saved Recipes", "Nearby Restaurants"
 * Part of the typography hierarchy system
 */
export function SectionHeading({
  children,
  className = '',
  as: Component = 'h2',
}: SectionHeadingProps) {
  const classes = [
    'font-bold',            // Bold (700)
    'text-lg',              // 18px base
    'text-[#1A1A1A]',       // Dark grey
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component 
      className={classes}
      style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
    >
      {children}
    </Component>
  );
}

