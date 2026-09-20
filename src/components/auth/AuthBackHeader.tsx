'use client';

import { useRouter } from 'next/navigation';

// Always sends the user to the home page rather than router.back() - the
// login page can be reached from a middleware bounce (e.g. hitting
// /dashboard while logged out), so browser history could send "back"
// straight into another auth redirect loop instead of somewhere sane.
export default function AuthBackHeader() {
  const router = useRouter();

  return (
    <div className="pt-3">
      <button onClick={() => router.push('/')} className="btn btn-link ps-0 auth-back" type="button">
        ← Back
      </button>
    </div>
  );
}
