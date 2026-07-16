'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import TakoAssistant from './TakoAssistant';

// Global floating Tako FAB, mounted once in (main)/layout.tsx so it persists
// across client-side navigation - ported from FUZO_V3/js/tako.js's
// site-wide FAB + overlay pattern. Hidden on /ai-chef itself, which already
// renders the full TakoAssistant experience inline.
export default function TakoWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === '/ai-chef') return null;

  return (
    <>
      <button className="tako-fab" onClick={() => setIsOpen(true)} aria-label="Open Tako, your AI food assistant">
        <Bot size={26} />
      </button>
      <TakoAssistant variant="overlay" isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
