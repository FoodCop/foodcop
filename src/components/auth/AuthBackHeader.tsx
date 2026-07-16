'use client';

import { useRouter } from 'next/navigation';

// Replaces RomioBackHeader.tsx - same router.back() behavior, plain Bootstrap
// button instead of Romio's compiled CSS classes.
export default function AuthBackHeader() {
  const router = useRouter();

  return (
    <div className="pt-3">
      <button onClick={() => router.back()} className="btn btn-link ps-0 text-decoration-none" type="button">
        ← Back
      </button>
    </div>
  );
}
