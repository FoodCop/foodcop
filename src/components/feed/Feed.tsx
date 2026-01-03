import { useState, useEffect } from 'react';
import { FeedDesktop } from './FeedDesktop';
import { FeedMobile } from './FeedMobile';

/**
 * Feed Component
 * Main feed component that renders desktop or mobile version based on screen size
 */
export function Feed() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return isDesktop ? <FeedDesktop /> : <FeedMobile />;
}
