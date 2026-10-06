'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Always sends the user to the home page rather than router.back() - the
// login page can be reached from a middleware bounce (e.g. hitting
// /dashboard while logged out), so browser history could send "back"
// straight into another auth redirect loop instead of somewhere sane.
// Same cream pill as the login card's "Home" link (.fz-auth__back).
export default function AuthBackHeader() {
  const router = useRouter();

  return (
    <div className="pt-3">
      <button onClick={() => router.push('/')} className="fz-auth__back" type="button">
        <ArrowLeft size={15} /> Home
      </button>
    </div>
  );
}
