/**
 * SNAP Component - Unified Snap Feature
 * Automatically selects mobile or desktop version based on screen size
 */

import { useState, useEffect } from 'react';
import { Snap as SnapMobile } from './Snap';
import { SnapDesktop } from './SnapDesktop';

export function SnapContainer() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLoading(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return isMobile ? <SnapMobile /> : <SnapDesktop />;
}

export { Snap } from './Snap';
export { SnapDesktop } from './SnapDesktop';
