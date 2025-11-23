import { supabase } from '../../services/supabase';
import { Button } from '../ui/button';
import { cookieUtils } from '../../utils/cookies';

interface SupabaseAuthProps {
  redirectTo?: string;
  onAuthSuccess?: () => void;
}

export function SupabaseAuth({ 
  redirectTo
}: SupabaseAuthProps) {
  
  const handleGoogleSignIn = async () => {
    try {
      console.log('🔑 Starting Google OAuth sign-in...');
      
      // Use current origin for redirect (works in both dev and prod)
      const redirectUrl = redirectTo || `${window.location.origin}/auth`;
      
      // Store return path for after authentication (use React Router path)
      const currentPath = window.location.pathname || '/plate';
      cookieUtils.setReturnPath(currentPath);
      
      console.log('🔑 OAuth redirect URL:', redirectUrl);
      console.log('🔑 Stored return path:', currentPath);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('❌ OAuth sign-in error:', error);
        return;
      }
      
      console.log('✅ OAuth sign-in initiated:', data);
    } catch (err) {
      console.error('❌ Sign-in error:', err);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Button
        onClick={handleGoogleSignIn}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </Button>
      
      <div className="mt-4 text-center space-y-1">
        <p className="text-[8pt] text-gray-500">
          Secure authentication powered by Google
        </p>
        <p className="text-[8pt] text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}