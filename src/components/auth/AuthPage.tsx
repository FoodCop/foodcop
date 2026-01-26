import { useAuth } from './AuthProvider';
import { SupabaseAuth } from './SupabaseAuth';
import { cookieUtils } from '../../utils/cookies';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const { user, session, loading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(false);
  const hasCheckedAuth = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect after successful authentication
  useEffect(() => {
    if (user && session && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      setCheckingAuth(true);
      redirectAfterAuth();
    }
  }, [user, session, navigate, location]);

  const redirectAfterAuth = async () => {
    try {
      // CRITICAL: Log current origin to debug redirect issues
      console.log('🔍 AuthPage redirectAfterAuth: Current origin:', window.location.origin);
      console.log('🔍 AuthPage redirectAfterAuth: Current pathname:', window.location.pathname);
      console.log('🔍 AuthPage redirectAfterAuth: Current full URL:', window.location.href);
      
      // Check if there's a stored return path from before authentication
      let returnPath = cookieUtils.getAndClearReturnPath();
      console.log('🔍 AuthPage: Stored return path from cookie:', returnPath);
      
      // Also check location.state for return path (from ProtectedRoute)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      console.log('🔍 AuthPage: Return path from location.state:', from);
      
      // Clean up return path - remove any full URLs and keep only the path
      if (returnPath) {
        try {
          // If it's a full URL, extract just the pathname
          if (returnPath.startsWith('http://') || returnPath.startsWith('https://')) {
            const url = new URL(returnPath);
            returnPath = url.pathname;
            console.log('🔧 Extracted path from full URL:', returnPath);
          }
          // Remove hash if present
          if (returnPath.startsWith('#')) {
            returnPath = returnPath.slice(1);
          }
          // Ensure it starts with /
          if (!returnPath.startsWith('/')) {
            returnPath = `/${returnPath}`;
          }
        } catch (e) {
          // If URL parsing fails, treat as path
          console.warn('⚠️ Could not parse return path as URL, treating as path:', returnPath);
        }
      }
      
      // CRITICAL: Always use relative paths to ensure we stay on current origin
      // Only use return path if it's valid and not auth page
      if (returnPath && returnPath !== '/auth' && returnPath !== '#auth' && returnPath.startsWith('/')) {
        console.log('✅ User authenticated, redirecting to stored path:', returnPath);
        console.log('✅ Will navigate to:', returnPath, 'on origin:', window.location.origin);
        navigate(returnPath, { replace: true });
      } else if (from && from !== '/auth' && from.startsWith('/')) {
        console.log('✅ User authenticated, redirecting to previous path:', from);
        console.log('✅ Will navigate to:', from, 'on origin:', window.location.origin);
        navigate(from, { replace: true });
      } else {
        // Always route to /plate after OAuth - preferences dialog will show if needed
        console.log('✅ User authenticated, redirecting to Plate (default)');
        console.log('✅ Will navigate to: /plate on origin:', window.location.origin);
        navigate('/plate', { replace: true });
      }
    } catch (error) {
      console.error('❌ Error during post-auth redirect:', error);
      // Default to plate on error - always use relative path
      console.log('✅ Error occurred, defaulting to /plate on origin:', window.location.origin);
      navigate('/plate', { replace: true });
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
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img 
            src="/logo_mobile.png" 
            alt="FUZO" 
            className="w-32 h-32 mb-8"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#ff6900', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-profile flex items-center justify-center" style={{ fontSize: '10pt' }}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <img 
            src="/logo_mobile.png" 
            alt="FUZO" 
            className="h-16 mx-auto mb-4"
          />
        </div>
        
        <SupabaseAuth />
      </div>
    </div>
  );
}