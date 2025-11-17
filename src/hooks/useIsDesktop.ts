import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is desktop size (>= 1024px)
 * @returns boolean - true if viewport width >= 1024px
 */
export const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
};
