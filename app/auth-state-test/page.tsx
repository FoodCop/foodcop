'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { SimpleUserStatus } from '@/components/auth/SimpleUserStatus';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';

export default function AuthTestPage() {
  const { user, loading } = useAuth();
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();
    
    // Get current session directly from Supabase
    supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: Session | null }, error: AuthError | null }) => {
      console.log('Direct Supabase session check:', { session, error });
      setSupabaseSession(session);
      setSessionLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state change event:', event, session);
      setSupabaseSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Auth State Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Auth Hook State:</h2>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>User: {user ? 'authenticated' : 'not authenticated'}</p>
          {user && (
            <div>
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Name: {user.name || 'No name'}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-semibold">Direct Supabase Session:</h2>
          <p>Session Loading: {sessionLoading ? 'true' : 'false'}</p>
          <p>Session: {supabaseSession ? 'exists' : 'null'}</p>
          {supabaseSession && (
            <div>
              <p>User ID: {supabaseSession.user?.id}</p>
              <p>Email: {supabaseSession.user?.email}</p>
              <p>Name: {supabaseSession.user?.user_metadata?.full_name || supabaseSession.user?.user_metadata?.name || 'No name'}</p>
              {supabaseSession.expires_at && (
                <p>Expires: {new Date(supabaseSession.expires_at * 1000).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">User Status Indicator Component:</h2>
          <SimpleUserStatus />
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Manual User Display:</h2>
          {user ? (
            <span className="text-xs text-gray-500">
              You are logged in as {user.name || user.email?.split('@')[0] || 'User'}
            </span>
          ) : (
            <span className="text-xs text-gray-500">Not logged in</span>
          )}
        </div>

        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold">Debug Actions:</h2>
          <button 
            onClick={async () => {
              const supabase = supabaseBrowser();
              const { data, error } = await supabase.auth.getSession();
              console.log('Manual session check:', { data, error });
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          >
            Check Session
          </button>
          <button 
            onClick={() => {
              window.location.reload();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}