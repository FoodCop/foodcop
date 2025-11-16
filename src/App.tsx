import { useState, useEffect, lazy, Suspense, useRef } from 'react'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { LogOut, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import { MobileRadialNav } from './components/navigation/MobileRadialNav'
import './App.css'
import './styles/mobile.css'

// Page type definition
type PageType = 'landing' | 'newlanding' | 'auth' | 'onboarding' | 'debug' | 'dash' | 'dashnew' | 'bites' | 'bitesnew' | 'trims' | 'trimsnew' | 'scout' | 'scoutnew' | 'plate' | 'platenew' | 'feed' | 'feednew' | 'chat' | 'snap' | 'snapnew' | 'discover'

// Eager load critical components
import { LandingPage } from './components/home/components/LandingPage'
import { NewLandingPage } from './components/home/NewLandingPage'
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

// Helper component for dropdown menu item
interface DropdownMenuItemProps {
  page: PageType;
  icon: string;
  label: string;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  setNewPagesDropdownOpen: (open: boolean) => void;
}

const DropdownMenuItem = ({ page, icon, label, currentPage, setCurrentPage, setNewPagesDropdownOpen }: DropdownMenuItemProps) => (
  <button
    onClick={() => {
      setCurrentPage(page);
      globalThis.location.hash = `#${page}`;
      setNewPagesDropdownOpen(false);
    }}
    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
      currentPage === page
        ? 'bg-orange-50 text-orange-600'
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
  const [currentPage, setCurrentPage] = useState<PageType>('newlanding')
  const [newPagesDropdownOpen, setNewPagesDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNewPagesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

          {/* New Pages Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNewPagesDropdownOpen(!newPagesDropdownOpen)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                ['feednew', 'scoutnew', 'bitesnew', 'trimsnew', 'snapnew', 'platenew', 'dashnew', 'newlanding'].includes(currentPage)
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>✨ New Pages</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${newPagesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {newPagesDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <DropdownMenuItem page="feednew" icon="🍽️" label="Feed New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="scoutnew" icon="🕵️" label="Scout New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="bitesnew" icon="🎬" label="Bites New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="trimsnew" icon="✂️" label="Trims New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="snapnew" icon="📸" label="Snap New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="platenew" icon="🍽️" label="Plate New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="dashnew" icon="📊" label="Dashboard New" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                  <DropdownMenuItem page="newlanding" icon="🏠" label="New Landing" currentPage={currentPage} setCurrentPage={setCurrentPage} setNewPagesDropdownOpen={setNewPagesDropdownOpen} />
                </div>
              </div>
            )}
          </div>

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
        'landing', 'newlanding', 'auth', 'onboarding', 'feed', 'feednew', 'scout', 'scoutnew', 'bites', 'bitesnew',
        'trims', 'trimsnew', 'snap', 'snapnew', 'dash', 'dashnew', 'plate', 'platenew', 'discover', 'debug'
        // 'chat' - temporarily hidden, not complete
      ];
      
      if (hash && validPages.includes(hash)) {
        setCurrentPage(hash as PageType);
      } else if (!hash) {
        setCurrentPage('newlanding');
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
          <LandingPage onNavigateToSignup={() => {
            setCurrentPage('auth');
            globalThis.location.hash = '#auth';
          }} />
        </PageWrapper>

        <PageWrapper page="newlanding" eager currentPage={currentPage}>
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

        <PageWrapper page="scoutnew" currentPage={currentPage}>
          <ScoutNewApp />
        </PageWrapper>

        <PageWrapper page="bites" currentPage={currentPage}>
          <BitesApp />
        </PageWrapper>

        <PageWrapper page="bitesnew" currentPage={currentPage}>
          <BitesNewApp />
        </PageWrapper>

        <PageWrapper page="trims" currentPage={currentPage}>
          <TrimsApp />
        </PageWrapper>

        <PageWrapper page="trimsnew" currentPage={currentPage}>
          <TrimsNewApp />
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

        <PageWrapper page="platenew" currentPage={currentPage}>
          <PlateNewApp />
        </PageWrapper>

        <PageWrapper page="chat" currentPage={currentPage}>
          <ChatWithAuth />
        </PageWrapper>

        <PageWrapper page="discover" currentPage={currentPage}>
          <FoodDiscoveryApp />
        </PageWrapper>

        <PageWrapper page="dashnew" currentPage={currentPage}>
          <DashNewApp />
        </PageWrapper>

        <PageWrapper page="snapnew" currentPage={currentPage}>
          <SnapNewApp />
        </PageWrapper>

        <PageWrapper page="feednew" currentPage={currentPage}>
          <FeedNewApp />
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
