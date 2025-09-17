import React, { useState } from 'react';
import { FuzoButton } from './FuzoButton';

const PAGES = [
  { name: 'Feed', path: '/feed' },
  { name: 'Scout', path: '/scout' },
  { name: 'Snap', path: '/snap' },
  { name: 'Bites', path: '/bites' },
  { name: 'Profile', path: '/profile' },
  { name: 'Chat', path: '/chat' },
  { name: 'AI Assistant', path: '/ai-assistant' },
];

interface HamburgerMenuProps {
  onNavigate?: (page: string) => void;
}

export function HamburgerMenu({ onNavigate }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      <FuzoButton
        variant="tertiary"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
      >
        {open ? 'Close Menu' : 'Menu'}
      </FuzoButton>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            background: 'var(--fuzo-white)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: '0.75rem',
            padding: '16px 0',
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {PAGES.map((page) => (
            <button
              key={page.path}
              style={{
                padding: '12px 24px',
                color: 'var(--fuzo-navy)',
                background: 'var(--fuzo-white)',
                border: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                borderRadius: '0.5rem',
                transition: 'background 0.2s',
                cursor: 'pointer',
                display: 'block',
                textAlign: 'left',
              }}
              onClick={() => {
                setOpen(false);
                if (onNavigate) onNavigate(page.name.toLowerCase());
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--fuzo-coral)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--fuzo-white)')}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
