'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';

// Sticky, frosted-glass header bar – matches the Direction B design system
// (warm cream + $fz-ink on bg-white → warm cream with backdrop blur).
export default function ProfileHeader({
  title = 'Profile',
  onSettingsClick,
}: {
  title?: string;
  /** Renders a gear icon opposite the title – navigates straight to the
   * Settings screen. Omit to hide the icon entirely. */
  onSettingsClick?: () => void;
}) {
  const router = useRouter();
  // Keying the icon on a click counter forces React to remount it each tap,
  // restarting the CSS animation from frame zero.
  const [spinKey, setSpinKey] = useState(0);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header className="profile-topbar">
      <button
        onClick={handleBack}
        className="btn p-0 border-0 bg-transparent d-flex align-items-center gap-1"
        style={{ color: 'var(--fz-ink, #241f16)', fontWeight: 800, fontSize: '0.95rem' }}
        type="button"
        aria-label="Back to previous screen"
        title="Back to previous screen"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>

      <span className="profile-topbar__title">{title}</span>

      {onSettingsClick ? (
        <button
          type="button"
          className="profile-topbar__gear btn p-0 border-0"
          aria-label="Open settings"
          onClick={() => {
            setSpinKey((k) => k + 1);
            onSettingsClick();
          }}
        >
          <Settings key={spinKey} size={18} className={spinKey > 0 ? 'profile-settings-spin' : ''} />
        </button>
      ) : (
        <span style={{ width: 36 }} />
      )}
    </header>
  );
}

