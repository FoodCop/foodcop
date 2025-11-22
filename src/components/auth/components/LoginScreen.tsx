import { useState, useEffect } from 'react';
import { Button } from '../../ui/button-simple';
import type { SupabaseClient } from '@supabase/supabase-js';

interface LoginScreenProps {
  supabase: SupabaseClient;
}

export function LoginScreen({ supabase }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test Supabase connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Supabase connection test:', { data, error });
      } catch (err) {
        console.error('Supabase connection failed:', err);
      }
    };
    testConnection();
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use current origin for redirect (works in both dev and prod)
      const redirectTo = `${window.location.origin}/auth`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      console.log('=== GOOGLE CLOUD CONSOLE SETUP ===');
      console.log('Add THIS redirect URI to Google Cloud Console:');
      console.log(`${supabaseUrl}/auth/v1/callback`);
      console.log('(Do NOT add the local app URL to Google)');
      console.log('Current redirect URL:', redirectTo);
      console.log('====================================');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      console.log('OAuth initiation response:', { data, error });

      if (error) {
        console.error('Google sign-in error:', error);
        setError(`Authentication error: ${error.message}`);
        setIsLoading(false);
      }
      // Don't set loading to false here - let the redirect happen
    } catch (err) {
      console.error('Unexpected error during sign-in:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-1">Authentication Error</h4>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Check the browser console for more details.
              </p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Terms of Service</p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}