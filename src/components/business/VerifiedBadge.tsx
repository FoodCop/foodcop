import { BadgeCheck } from 'lucide-react';

// The FUZO Verified badge (client spec v1, section 9): only for businesses
// whose documents FUZO approved (restaurant_profiles.is_verified, set by the
// server). Never shown for unverified businesses.

export default function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`fz-verified fz-verified--${size}`} title="FUZO Verified: this business's documents were checked by FUZO">
      <BadgeCheck size={size === 'sm' ? 13 : 15} strokeWidth={2.4} aria-hidden="true" />
      Verified
      <span className="visually-hidden"> by FUZO</span>
    </span>
  );
}
