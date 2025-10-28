import { useState, useEffect } from 'react';
import { Plate } from './components/Plate';
import { Toaster } from '../ui/sonner';
import { useAuth } from '../auth/AuthProvider';
import { LoginButton } from '../auth/LoginButton';
import { cookieUtils } from '../../utils/cookies';

export default function App() {
  const { user, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Plate: Auth state check:', {
      user: user ? {
        userId: user.id,
        email: user.email
      } : null,
      loading
    });
    
    // Check if user was redirected here after auth
    const returnPath = cookieUtils.getAndClearReturnPath();
    if (returnPath && user) {
      console.log('🍪 Plate: User returned after auth, original path:', returnPath);
    }
  }, [user, loading]);

  const handleSignInClick = () => {
    // Store current page for redirect after auth
    cookieUtils.setReturnPath('/plate');
    window.location.hash = '#auth';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your plate...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Food Plate</h2>
          <p className="text-gray-600 mb-6">
            Sign in to save and organize your favorite restaurants and dishes
          </p>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{authError}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={handleSignInClick}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign in to view your plate
            </button>
            
            <p className="text-xs text-gray-500">
              Your saved restaurants and dishes will appear here after signing in
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Plate</h1>
            <p className="text-gray-600 mt-1">
              Your saved restaurants and favorite dishes
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <LoginButton />
          </div>
        </div>
        
        <Plate userId={user.id} currentUser={user} />
      </div>
    </div>
  );
}