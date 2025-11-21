import { useAuth } from './AuthProvider';
import { SupabaseAuth } from './SupabaseAuth';
import { cookieUtils } from '../../utils/cookies';
import { useEffect, useState, useRef } from 'react';

interface AuthPageProps {
  readonly isVisible?: boolean;
}

export default function AuthPage({ isVisible = true }: AuthPageProps) {
  const { user, session, loading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(false);
  const hasCheckedAuth = useRef(false);

  // Redirect to #plate after successful authentication
  useEffect(() => {
    if (user && session && !hasCheckedAuth.current && isVisible) {
      hasCheckedAuth.current = true;
      setCheckingAuth(true);
      redirectAfterAuth();
    }
  }, [user, session, isVisible]);

  const redirectAfterAuth = async () => {
    try {
      // Check if there's a stored return path from before authentication
      const returnPath = cookieUtils.getAndClearReturnPath();
      
      if (returnPath && returnPath !== '#auth') {
        console.log('✅ User authenticated, redirecting to stored path:', returnPath);
        globalThis.location.hash = returnPath;
      } else {
        // Always route to #plate after OAuth - preferences dialog will show if needed
        console.log('✅ User authenticated, redirecting to Plate');
        globalThis.location.hash = '#plate';
      }
    } catch (error) {
      console.error('❌ Error during post-auth redirect:', error);
      // Default to plate on error
      globalThis.location.hash = '#plate';
    } finally {
      setCheckingAuth(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Show loading while redirecting after auth
    if (checkingAuth) {
      return (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
          <div className="flex flex-col items-center">
            <img 
              src="/logo_mobile.png" 
              alt="FUZO" 
              className="w-32 h-32 mb-8"
            />
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#ff6900', borderTopColor: 'transparent' }}></div>
          </div>
        </div>
      );
    }

    // This should not be reached since we redirect immediately after auth
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🎉</div>
          <div className="text-green-600 font-bold text-xl mb-2">
            Welcome to FUZO!
          </div>
          <p className="text-gray-600 mb-6">
            Great to have you aboard! Redirecting you now...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-3xl sm:text-4xl mb-4">🍜</div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">Join the FUZO Community</h2>
          <p className="text-gray-600">Ready to discover amazing food? Sign in to start your culinary adventure with Tako!</p>
        </div>
        
        <SupabaseAuth />
        
        <div className="mt-6 text-center">
          <div className="bg-orange-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800 font-medium">🎯 What's Next?</p>
            <p className="text-xs text-orange-700 mt-1">
              After signing in, you'll set up your food preferences and start discovering personalized content!
            </p>
          </div>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}