import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import { MobileRadialNav } from './components/navigation/MobileRadialNav'
import './App.css'
import './styles/mobile.css'

// Page type definition
type PageType = 'landing' | 'auth' | 'onboarding' | 'debug' | 'dash' | 'dashnew' | 'bites' | 'bitesnew' | 'trims' | 'trimsnew' | 'scout' | 'scoutnew' | 'plate' | 'platenew' | 'feed' | 'feednew' | 'chat' | 'snap' | 'snapnew' | 'discover'

// Eager load critical components
import { LandingPage } from './components/home/components/LandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'

// Lazy load page components for code splitting
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'))
const FeedApp = lazy(() => import('./components/feed/App'))
const FeedNewApp = lazy(() => import('./components/feed/FeedNew').then(module => ({ default: module.FeedNew })))
const ScoutApp = lazy(() => import('./components/scout/App'))
const ScoutNewApp = lazy(() => import('./components/scout/ScoutNew'))
const BitesApp = lazy(() => import('./components/bites/App'))
const BitesNewApp = lazy(() => import('./components/bites/BitesNew'))
const TrimsApp = lazy(() => import('./components/trims/App'))
const TrimsNewApp = lazy(() => import('./components/trims/TrimsNew'))
const DashApp = lazy(() => import('./components/dash/App'))
const DashNewApp = lazy(() => import('./components/dash/components/DashboardNew').then(module => ({ default: module.DashboardNew })))
const SnapApp = lazy(() => import('./components/snap/App'))
const SnapNewApp = lazy(() => import('./components/snap/SnapNew').then(module => ({ default: module.SnapNew })))
const PlateApp = lazy(() => import('./components/plate/App'))
const PlateNewApp = lazy(() => import('./components/plate/PlateNew'))
const ChatWithAuth = lazy(() => import('./components/chat').then(module => ({ default: module.ChatWithAuth })))
const FoodDiscoveryApp = lazy(() => import('./components/discover/App'))

// Loading component for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigation component with auth context access
  const Navigation = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
      try {
        console.log('🚪 Sign out requested from navigation');
        await signOut();
        toast.success('Successfully signed out');
        setCurrentPage('landing');
        console.log('✅ Sign out completed');
      } catch (error) {
        console.error('❌ Sign out failed:', error);
        toast.error('Failed to sign out');
      }
    };

    return (
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
            🍽️ Feed
          </button>
          <button
            onClick={() => {
              setCurrentPage('feednew');
              globalThis.location.hash = '#feednew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'feednew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Feed New
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
            🕵️ Scout
          </button>
          <button
            onClick={() => {
              setCurrentPage('scoutnew');
              globalThis.location.hash = '#scoutnew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'scoutnew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Scout New
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
            🎬 Bites
          </button>
          <button
            onClick={() => {
              setCurrentPage('bitesnew');
              globalThis.location.hash = '#bitesnew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'bitesnew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Bites New
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
            ✂️ Trims
          </button>
          <button
            onClick={() => {
              setCurrentPage('trimsnew');
              globalThis.location.hash = '#trimsnew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'trimsnew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Trims New
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
            📸 Snap
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
            🍽️ Plate
          </button>
          <button
            onClick={() => {
              setCurrentPage('platenew');
              globalThis.location.hash = '#platenew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'platenew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Plate New
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
            📊 Dashboard
          </button>
          <button
            onClick={() => {
              setCurrentPage('dashnew');
              globalThis.location.hash = '#dashnew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'dashnew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Dashboard New
          </button>
          <button
            onClick={() => {
              setCurrentPage('snapnew');
              globalThis.location.hash = '#snapnew';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'snapnew' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Snap New
          </button>
          {/* Chat temporarily hidden - not complete */}
          {/* <button
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
            💬 Chat
          </button> */}
          <button
            onClick={() => {
              setCurrentPage('discover');
              globalThis.location.hash = '#discover';
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 'discover' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔍 Discover
          </button>

          {/* User Profile Dropdown */}
          {user && (
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Hash-based routing (will be replaced with React Router later)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = globalThis.location.hash.slice(1);
      const validPages = [
        'landing', 'auth', 'onboarding', 'feed', 'feednew', 'scout', 'scoutnew', 'bites', 'bitesnew',
        'trims', 'trimsnew', 'snap', 'snapnew', 'dash', 'dashnew', 'plate', 'platenew', 'discover', 'debug'
        // 'chat' - temporarily hidden, not complete
      ];
      
      if (hash && validPages.includes(hash)) {
        setCurrentPage(hash);
      } else if (!hash) {
        setCurrentPage('landing');
      }
    };

    handleHashChange();
    globalThis.addEventListener('hashchange', handleHashChange);
    return () => globalThis.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protected onboarding component that uses AuthProvider session
  const OnboardingProtectedFlow = () => {
    const { user, session, loading } = useAuth();
    
    if (loading) {
      return <PageLoader />;
    }
    
    if (!user || !session) {
      console.log('🚫 Onboarding access denied: User not authenticated, redirecting to auth');
      globalThis.location.hash = '#auth';
      return <PageLoader />;
    }
    
    return (
      <Suspense fallback={<PageLoader />}>
        <OnboardingFlow />
      </Suspense>
    );
  };

  // Render all pages but only show the active one (keeps state between navigations)
  const renderAllPages = () => {
    return (
      <>
        {/* Landing Page */}
        <div style={{ display: currentPage === 'landing' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <LandingPage onNavigateToSignup={() => {
              setCurrentPage('auth');
              globalThis.location.hash = '#auth';
            }} />
          </PageErrorBoundary>
        </div>

        {/* Auth Page */}
        <div style={{ display: currentPage === 'auth' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <AuthPage />
          </PageErrorBoundary>
        </div>

        {/* Debug Page */}
        <div style={{ display: currentPage === 'debug' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <DebugApp />
          </PageErrorBoundary>
        </div>

        {/* Onboarding */}
        <div style={{ display: currentPage === 'onboarding' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <OnboardingProtectedFlow />
          </PageErrorBoundary>
        </div>

        {/* Feed App */}
        <div style={{ display: currentPage === 'feed' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <FeedApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Scout App */}
        <div style={{ display: currentPage === 'scout' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ScoutApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Scout New (Discover Style) */}
        <div style={{ display: currentPage === 'scoutnew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ScoutNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Bites App */}
        <div style={{ display: currentPage === 'bites' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <BitesApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Bites New (Discover Style) */}
        <div style={{ display: currentPage === 'bitesnew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <BitesNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Trims App */}
        <div style={{ display: currentPage === 'trims' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <TrimsApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Trims New (Discover Style) */}
        <div style={{ display: currentPage === 'trimsnew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <TrimsNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Snap App */}
        <div style={{ display: currentPage === 'snap' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SnapApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Dashboard App */}
        <div style={{ display: currentPage === 'dash' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <DashApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Plate App */}
        <div style={{ display: currentPage === 'plate' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PlateApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Plate New (Discover Style) */}
        <div style={{ display: currentPage === 'platenew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PlateNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Chat App */}
        <div style={{ display: currentPage === 'chat' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ChatWithAuth />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Discover App */}
        <div style={{ display: currentPage === 'discover' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <FoodDiscoveryApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Dashboard New (Discover Style) */}
        <div style={{ display: currentPage === 'dashnew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <DashNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Snap New (Discover Style) */}
        <div style={{ display: currentPage === 'snapnew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SnapNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>

        {/* Feed New (Discover Style) */}
        <div style={{ display: currentPage === 'feednew' ? 'block' : 'none' }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <FeedNewApp />
            </Suspense>
          </PageErrorBoundary>
        </div>
      </>
    );
  };

  return (
    <ErrorBoundary>
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
            {renderAllPages()}
          </div>
          
          {/* Mobile Radial Navigation - Only show on main app pages */}
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
          
          {/* Toast Notifications */}
          <Toaster position="top-center" />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
