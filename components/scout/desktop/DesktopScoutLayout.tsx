'use client';

import React from 'react';

interface DesktopScoutLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export function DesktopScoutLayout({
  children,
  sidebar,
  className = ''
}: DesktopScoutLayoutProps) {
  return (
    <div className={`scout-desktop-layout ${className}`}>
      {/* Desktop Sidebar */}
      <div className="scout-sidebar desktop-only">
        {sidebar}
      </div>

      {/* Map Area */}
      <div className="scout-map-area">
        {children}
      </div>

      {/* Mobile Overlay - Hidden by default, shown when mobile sidebar is active */}
      <div className="scout-mobile-overlay mobile-only">
        {sidebar}
      </div>
    </div>
  );
}

export default DesktopScoutLayout;