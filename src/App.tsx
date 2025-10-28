import { useState, useEffect } from 'react'
import { LandingPage } from './components/home/components/LandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { ProfileService } from './services/profileService'
import { AuthService } from './services/authService'
import FeedApp from './components/feed/App'
import ScoutApp from './components/scout/App'
import BitesApp from './components/bites/App'
import TrimsApp from './components/trims/App'
import DashApp from './components/dash/App'
import SnapApp from './components/snap/App'
import PlateIndex from './pages/plate/index'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { Menu, X, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigation component with auth context access
  const Navigation = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
      try {
        console.log('🚪 Sign out requested from navigation');
        await signOut();
        toast.success('Successfully signed out');
        setCurrentPage('landing'); // Redirect to landing page
        console.log('✅ Sign out completed');
      } catch (error) {
        console.error('❌ Sign out failed:', error);
        toast.error('Failed to sign out');
      }
    };

    return (
      <>
        <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <div className="text-lg sm:text-xl font-bold text-orange-600">FUZO</div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage('feed')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'feed' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🍽️ Feed
          </button>
          <button
            onClick={() => setCurrentPage('scout')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'scout' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🕵️ Scout
          </button>
          <button
            onClick={() => setCurrentPage('plate')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'plate' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🍽️ Plate
          </button>
          <button
            onClick={() => setCurrentPage('bites')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'bites' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🍰 Bites
          </button>
          <button
            onClick={() => setCurrentPage('snap')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'snap' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📸 Snap
          </button>
          <button
            onClick={() => setCurrentPage('trims')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'trims' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✂️ Trims
          </button>
          <button
            onClick={() => setCurrentPage('dash')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'dash' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Dash
          </button>
          
          {/* Sign Out Button - Desktop */}
          {user && (
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
          
          {/* User Avatar */}
          {user && (
            <Avatar className="w-8 h-8 ml-2">
              <AvatarImage 
                src={user.user_metadata?.avatar_url} 
                alt={user.user_metadata?.full_name || user.email || 'User'} 
              />
              <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Mobile Navigation - Hamburger Menu */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Avatar */}
          {user && (
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={user.user_metadata?.avatar_url} 
                alt={user.user_metadata?.full_name || user.email || 'User'} 
              />
              <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="grid grid-cols-3 gap-2 p-4">
            <button
              onClick={() => {
                setCurrentPage('feed');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'feed' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">🍽️</span>
              Feed
            </button>
            <button
              onClick={() => {
                setCurrentPage('scout');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'scout' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">🕵️</span>
              Scout
            </button>
            <button
              onClick={() => {
                setCurrentPage('plate');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'plate' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">🍽️</span>
              Plate
            </button>
            <button
              onClick={() => {
                setCurrentPage('bites');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'bites' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">🍰</span>
              Bites
            </button>
            <button
              onClick={() => {
                setCurrentPage('snap');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'snap' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">📸</span>
              Snap
            </button>
            <button
              onClick={() => {
                setCurrentPage('trims');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'trims' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">✂️</span>
              Trims
            </button>
            <button
              onClick={() => {
                setCurrentPage('dash');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'dash' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">📊</span>
              Dash
            </button>
            
            {/* Sign Out Button - Mobile */}
            {user && (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
      </>
    );
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: { displayName: string; location: string }) => {
    try {
      console.log('🎯 Completing onboarding with data:', data);
      
      const result = await ProfileService.completeOnboarding(data);
      
      if (result.success) {
        console.log('✅ Onboarding completed successfully');
        // Redirect to dashboard
        setCurrentPage('dash');
        window.location.hash = '#dash';
      } else {
        console.error('❌ Onboarding completion failed:', result.error);
        // Could show an error message to user here
      }
    } catch (error) {
      console.error('❌ Onboarding completion error:', error);
    }
  };

  // Simple routing based on URL hash
  useEffect(() => {
    // Check for OAuth callback on landing page
    const hash = window.location.hash.slice(1); // Remove the #
    
    // Handle different OAuth URL formats
    let cleanHash = hash;
    let oauthParams = '';
    let accessToken = null;
    
    // Format 1: "auth#access_token=..." (from initial OAuth redirect)
    if (hash.includes('#')) {
      const [route, params] = hash.split('#', 2);
      cleanHash = route;
      oauthParams = params;
      const hashParams = new URLSearchParams(params);
      accessToken = hashParams.get('access_token');
    }
    // Format 2: "auth?access_token=..." (after URL rewrite)
    else if (hash.includes('?')) {
      const [route, params] = hash.split('?', 2);
      cleanHash = route;
      oauthParams = params;
      const hashParams = new URLSearchParams(params);
      accessToken = hashParams.get('access_token');
    }
    // Format 3: Direct OAuth params "access_token=..."
    else {
      const hashParams = new URLSearchParams(hash);
      accessToken = hashParams.get('access_token');
      if (accessToken) {
        cleanHash = '';
        oauthParams = hash;
      }
    }
    
    console.log('🔍 Main App: Initial load check:', {
      originalHash: hash,
      cleanHash,
      oauthParams,
      hasAccessToken: !!accessToken,
      currentUrl: window.location.href
    });
    
    // If we have OAuth tokens and we're not already on the auth page with proper format
    if (accessToken && (!cleanHash || cleanHash !== 'auth' || hash.includes('#'))) {
      console.log('🔀 Main App: OAuth callback detected, ensuring proper auth page...');
      console.log('📋 OAuth tokens detected:', { accessToken: 'present' });
      
      // Only rewrite if not already in correct format
      if (!hash.startsWith('auth?')) {
        const properAuthUrl = `#auth?${oauthParams}`;
        console.log('🔧 Main App: Rewriting URL to:', properAuthUrl);
        window.history.replaceState(null, '', window.location.pathname + properAuthUrl);
      }
      setCurrentPage('auth');
      return;
    }
    
    // Normal routing logic
    if (cleanHash && !accessToken) {
      setCurrentPage(cleanHash);
    } else if (cleanHash === 'auth' && accessToken) {
      // Already on auth page with tokens, proceed normally
      setCurrentPage('auth');
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      // Extract just the route part for page setting
      const route = newHash.includes('?') ? newHash.split('?')[0] : newHash;
      setCurrentPage(route || 'landing');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Render appropriate component based on current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'debug':
        return <DebugApp />
      case 'auth':
        return <AuthPage />
      case 'onboarding':
        // Onboarding requires authentication - redirect to auth if not authenticated
        return <OnboardingProtectedFlow onComplete={handleOnboardingComplete} />
      case 'feed':
        return <FeedApp />
      case 'scout':
        return <ScoutApp />
      case 'bites':
        return <BitesApp />
      case 'trims':
        return <TrimsApp />
      case 'snap':
        return <SnapApp />
      case 'dash':
        return <DashApp />
      case 'plate':
        return <PlateIndex />
      case 'landing':
      default:
        return <LandingPage onNavigateToSignup={() => setCurrentPage('auth')} />
    }
  }

  // Protected onboarding component that checks authentication
  const OnboardingProtectedFlow = ({ onComplete }: { onComplete: (data: { displayName: string; location: string }) => Promise<void> }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const authStatus = await AuthService.checkAuthStatus();
          setIsAuthenticated(authStatus.success && !!authStatus.user);
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          setIsAuthenticated(false);
        } finally {
          setAuthChecked(true);
        }
      };

      checkAuth();
    }, []);

    if (!authChecked) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      console.log('🚫 Onboarding access denied: User not authenticated, redirecting to auth');
      // Redirect to auth page
      setTimeout(() => {
        window.location.hash = '#auth';
      }, 100);
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Authentication required. Redirecting...</p>
          </div>
        </div>
      );
    }

    return <OnboardingFlow onComplete={onComplete} />;
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Menu - Only show on main app pages, not landing, auth, or onboarding */}
        {/* Navigation Menu - Only show on main app pages, not landing, auth, or onboarding */}
        {currentPage !== 'landing' && currentPage !== 'auth' && currentPage !== 'onboarding' && (
          <div className="bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto px-4">
              <Navigation />
            </div>
          </div>
        )}

        {renderCurrentPage()}
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
