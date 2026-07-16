'use client';

import { useRouter } from 'next/navigation';

// Back-navigation logic follows the same router.back() pattern as
// AuthBackHeader.tsx. Re-skinned onto plain Bootstrap markup instead of
// Soziety's compiled CSS.
export default function ProfileHeader({ title = 'Profile' }: { title?: string }) {
  const router = useRouter();

  return (
    <header className="border-bottom bg-white">
      <div className="container d-flex align-items-center py-2 gap-2">
        <button onClick={() => router.push('/')} className="btn btn-link text-decoration-none px-0" type="button" aria-label="Back">
          ←
        </button>
        <h4 className="mb-0 fw-bold">{title}</h4>
      </div>
    </header>
  );
}
