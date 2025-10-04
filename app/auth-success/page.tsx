'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [sessionData, setSessionData] = useState<any>(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Force check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = supabaseBrowser();
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Auth success page session check:', { session, error });
      setSessionData(session);
      
      if (!session && !forceRefresh) {
        console.log('No session found, refreshing in 2 seconds...');
        setTimeout(() => {
          setForceRefresh(true);
          window.location.reload();
        }, 2000);
      }
    };
    
    checkSession();
  }, [forceRefresh]);

  useEffect(() => {
    if (!loading && user && sessionData) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Use setTimeout to move router.push out of render cycle
            setTimeout(() => {
              router.push('/feed');
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user, loading, sessionData, router]);

  if (loading || (!user && !forceRefresh)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Completing authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we set up your session.</p>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium">Debug Info:</h3>
            <p>User: {user ? 'found' : 'not found'}</p>
            <p>Session: {sessionData ? 'found' : 'not found'}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && forceRefresh) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Failed</h2>
          <p className="text-gray-600 mt-2">Something went wrong during sign-in.</p>
          <p className="text-sm text-gray-500 mt-2">The session could not be established.</p>
          <button 
            onClick={() => router.push('/auth-debug-simple')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-green-600">Welcome back!</h2>
        <p className="text-gray-600 mt-2">
          You are now signed in as <strong>{user?.name || user?.email}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Redirecting to your feed in {countdown} seconds...
        </p>
        <button 
          onClick={() => router.push('/feed')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Continue to Feed
        </button>
      </div>
    </div>
  );
}