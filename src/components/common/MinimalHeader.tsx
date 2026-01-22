import React from 'react';

interface MinimalHeaderProps {
  showLogo?: boolean;
  logoPosition?: 'left' | 'center' | 'right';
  className?: string;
}

export function MinimalHeader({ showLogo = false, logoPosition = 'left', className = '' }: MinimalHeaderProps) {
  return (
    <header className={`w-full ${className}`} style={{ fontSize: '10pt' }}>
      {/* Thin yellow line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: '#FFC909' }} />
      
      {/* Optional logo */}
      {showLogo && (
        <div
          className={`flex items-center px-4 py-2 ${
            logoPosition === 'center' ? 'justify-center' : logoPosition === 'right' ? 'justify-end' : 'justify-start'
          }`}
        >
          <img
            src="/logo_mobile.png"
            alt="FUZO"
            className="h-8"
          />
        </div>
      )}
    </header>
  );
}

