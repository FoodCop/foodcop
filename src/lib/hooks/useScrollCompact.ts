'use client';

import { useEffect, useState } from 'react';

/**
 * True while the page is scrolling down (past the first 80px); false when it
 * scrolls back up or reaches the top. Drives the icon-only dock / tab bar.
 */
export function useScrollCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setCompact(false);
        else if (y - lastY > 6) setCompact(true);
        else if (lastY - y > 6) setCompact(false);
        if (Math.abs(y - lastY) > 6 || y < 80) lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return compact;
}
