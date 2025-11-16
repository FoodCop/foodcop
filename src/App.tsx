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
type PageType = 'landing' | 'auth' | 'onboarding' | 'debug' | 'dash' | 'bites' | 'trims' | 'scout' | 'plate' | 'feed' | 'snap' | 'discover'

// Eager load critical components
import { NewLandingPage } from './components/home/NewLandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'

// Lazy load page components for code splitting
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'))
const FeedApp = lazy(() => import('./components/feed/FeedNew').then(module => ({ default: module.FeedNew })))
const ScoutApp = lazy(() => import('./components/scout/ScoutNew'))
const BitesApp = lazy(() => import('./components/bites/BitesNew'))
const TrimsApp = lazy(() => import('./components/trims/TrimsNew'))
const DashApp = lazy(() => import('./components/dash/components/DashboardNew').then(module => ({ default: module.DashboardNew })))
const SnapApp = lazy(() => import('./components/snap/SnapNew').then(module => ({ default: module.SnapNew })))
const PlateApp = lazy(() => import('./components/plate/PlateNew'))
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

// Helper component for navigation button
interface NavButtonProps {
  page: PageType;
  icon: string;
  label: string;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

const NavButton = ({ page, icon, label, currentPage, setCurrentPage }: NavButtonProps) => (
  <button
    onClick={() => {
      setCurrentPage(page);
      globalThis.location.hash = `#${page}`;
    }}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      currentPage === page 
        ? 'bg-orange-600 text-white' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {icon} {label}
  </button>
);

// Helper component to render a page conditionally
interface PageWrapperProps {
  page: PageType;
  children: React.ReactNode;
  eager?: boolean;
  currentPage: PageType;
}

const PageWrapper = ({ page, children, eager = false, currentPage }: PageWrapperProps) => (
  <div style={{ display: currentPage === page ? 'block' : 'none' }}>
    <PageErrorBoundary>
      {eager ? children : <Suspense fallback={<PageLoader />}>{children}</Suspense>}
    </PageErrorBoundary>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing')

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
          <NavButton page="feed" icon="🍽️" label="Feed" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="scout" icon="🕵️" label="Scout" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="bites" icon="🎬" label="Bites" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="trims" icon="✂️" label="Trims" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="snap" icon="📸" label="Snap" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="plate" icon="🍽️" label="Plate" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="dash" icon="📊" label="Dashboard" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavButton page="discover" icon="🔍" label="Discover" currentPage={currentPage} setCurrentPage={setCurrentPage} />

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
        'landing', 'auth', 'onboarding', 'feed', 'scout', 'bites',
        'trims', 'snap', 'dash', 'plate', 'discover', 'debug'
      ];
      
      if (hash && validPages.includes(hash)) {
        setCurrentPage(hash as PageType);
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
        <PageWrapper page="landing" eager currentPage={currentPage}>
          <NewLandingPage onNavigateToSignup={() => {
            setCurrentPage('auth');
            globalThis.location.hash = '#auth';
          }} />
        </PageWrapper>

        <PageWrapper page="auth" eager currentPage={currentPage}>
          <AuthPage isVisible={currentPage === 'auth'} />
        </PageWrapper>

        <PageWrapper page="debug" eager currentPage={currentPage}>
          <DebugApp />
        </PageWrapper>

        <PageWrapper page="onboarding" eager currentPage={currentPage}>
          <OnboardingProtectedFlow />
        </PageWrapper>

        <PageWrapper page="feed" currentPage={currentPage}>
          <FeedApp />
        </PageWrapper>

        <PageWrapper page="scout" currentPage={currentPage}>
          <ScoutApp />
        </PageWrapper>

        <PageWrapper page="bites" currentPage={currentPage}>
          <BitesApp />
        </PageWrapper>

        <PageWrapper page="trims" currentPage={currentPage}>
          <TrimsApp />
        </PageWrapper>

        <PageWrapper page="snap" currentPage={currentPage}>
          <SnapApp />
        </PageWrapper>

        <PageWrapper page="dash" currentPage={currentPage}>
          <DashApp />
        </PageWrapper>

        <PageWrapper page="plate" currentPage={currentPage}>
          <PlateApp />
        </PageWrapper>

        <PageWrapper page="discover" currentPage={currentPage}>
          <FoodDiscoveryApp />
        </PageWrapper>
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
                  setCurrentPage(page as PageType);
                  globalThis.location.hash = `#${page}`;
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
