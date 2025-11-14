import { useState, useEffect } from 'react'
import { LandingPage } from './components/home/components/LandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import FeedApp from './components/feed/App'
import ScoutApp from './components/scout/App'
import BitesApp from './components/bites/App'
import TrimsApp from './components/trims/App'
import DashApp from './components/dash/App'
import SnapApp from './components/snap/App'
import PlateApp from './components/plate/App'
import { ChatWithAuth } from './components/chat'
import FoodDiscoveryApp from './components/discover/App'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import { MobileRadialNav } from './components/navigation/MobileRadialNav'
import './App.css'
import './styles/mobile.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigation component with auth context access
  const Navigation = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
      try {
        console.log('ðŸšª Sign out requested from navigation');
        await signOut();
        toast.success('Successfully signed out');
        setCurrentPage('landing'); // Redirect to landing page
        console.log('âœ… Sign out completed');
      } catch (error) {
        console.error('âŒ Sign out failed:', error);
        toast.error('Failed to sign out');
      }
    };

    return (
      <>
        <div className="flex items-center justify-between h-16 safe-area-top px-4">
        {/* Logo - Mobile icon, Desktop full logo */}
        <div className="flex items-center">
          <img 
            src="/logo_mobile.png" 
            alt="FUZO" 
            className="h-8 md:hidden" 
          />
          <img 
            src="/logo_desktop.png" 
            alt="FUZO" 
            className="hidden md:block h-10" 
          />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => {
              setCurrentPage('feed');
              globalThis.location.hash = '#feed';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'feed' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ½ï¸ Feed
          </button>
          <button
            onClick={() => {
              setCurrentPage('scout');
              globalThis.location.hash = '#scout';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'scout' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ•µï¸ Scout
          </button>
          <button
            onClick={() => {
              setCurrentPage('plate');
              globalThis.location.hash = '#plate';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'plate' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ½ï¸ Plate
          </button>
          <button
            onClick={() => {
              setCurrentPage('bites');
              globalThis.location.hash = '#bites';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'bites' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ° Bites
          </button>
          <button
            onClick={() => {
              setCurrentPage('snap');
              globalThis.location.hash = '#snap';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'snap' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ“¸ Snap
          </button>
          <button
            onClick={() => {
              setCurrentPage('trims');
              globalThis.location.hash = '#trims';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'trims' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ��œ‚ï¸ Trims
          </button>
          <button
            onClick={() => {
              setCurrentPage('dash');
              globalThis.location.hash = '#dash';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'dash' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ“Š Dash
          </button>
          <button
            onClick={() => {
              setCurrentPage('chat');
              globalThis.location.hash = '#chat';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'chat' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ðŸ’¬ Chat
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

        {/* Mobile Navigation - Profile Pic Only (no hamburger) */}
        <div className="md:hidden">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="touch-target p-1"
              aria-label="Open menu"
            >
              <Avatar className="w-10 h-10 border-2 border-orange-500">
                <AvatarImage 
                  src={user.user_metadata?.avatar_url} 
                  alt={user.user_metadata?.full_name || user.email || 'User'} 
                />
                <AvatarFallback className="bg-orange-600 text-white font-medium">
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
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
              <span className="text-lg">ðŸ½ï¸</span>
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
              <span className="text-lg">ðŸ•µï¸</span>
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
              <span className="text-lg">ðŸ½ï¸</span>
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
              <span className="text-lg">ðŸ°</span>
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
              <span className="text-lg">ðŸ“¸</span>
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
              <span className="text-lg">âœ‚ï¸</span>
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
              <span className="text-lg">ðŸ“Š</span>
              Dash
            </button>
            <button
              onClick={() => {
                setCurrentPage('chat');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors ${
                currentPage === 'chat' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">ðŸ’¬</span>
              Chat
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

  // Simplified routing based on URL hash
  useEffect(() => {
    const hash = globalThis.location.hash.slice(1); // Remove the #
    
    // Extract route from hash (handle OAuth params)
    const route = hash.includes('?') ? hash.split('?')[0] : hash;
    const page = route || 'landing';
    
    console.log('ðŸ” Initial load, navigating to:', page);
    setCurrentPage(page);

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = globalThis.location.hash.slice(1);
      const newRoute = newHash.includes('?') ? newHash.split('?')[0] : newHash;
      const newPage = newRoute || 'landing';
      console.log('ðŸ”„ Hash changed, navigating to:', newPage);
      setCurrentPage(newPage);
    };

    globalThis.addEventListener('hashchange', handleHashChange);
    return () => globalThis.removeEventListener('hashchange', handleHashChange);
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
        return <OnboardingProtectedFlow />
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
        return <PlateApp />
      case 'chat':
        return <ChatWithAuth />
      case 'discover':
        return <FoodDiscoveryApp />
      case 'landing':
      default:
        return <LandingPage onNavigateToSignup={() => {
          setCurrentPage('auth');
          globalThis.location.hash = '#auth';
        }} />
    }
  }

  // Protected onboarding component that uses AuthProvider session
  const OnboardingProtectedFlow = () => {
    const { user, session, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!user || !session) {
      console.log('ðŸš« Onboarding access denied: User not authenticated, redirecting to auth');
      // Redirect to auth page
      globalThis.location.hash = '#auth';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Authentication required. Redirecting...</p>
          </div>
        </div>
      );
    }

    return <OnboardingFlow />;
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 mobile-app-container">
        {/* Desktop Navigation - Only show on authenticated pages */}
        {currentPage !== 'landing' && 
         currentPage !== 'auth' && 
         currentPage !== 'onboarding' && (
          <div className="bg-white border-b sticky top-0 z-50 hidden md:block">
            <div className="container mx-auto px-4">
              <Navigation />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="mobile-content-area">
          {renderCurrentPage()}
        </div>

        {/* Mobile Radial Navigation - Only show on main app pages and mobile devices */}
        {currentPage !== 'landing' && 
         currentPage !== 'auth' && 
         currentPage !== 'onboarding' && (
          <div className="md:hidden">
            <MobileRadialNav 
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                globalThis.location.hash = `#${page}`;
                setMobileMenuOpen(false);
              }}
            />
          </div>
        )}

        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
