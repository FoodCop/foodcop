import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { PageLoader } from './components/common/PageLoader'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { LogOut, MessageCircle } from 'lucide-react'
import { useDMChatStore } from './stores/chatStore'
import { toastHelpers } from './utils/toastHelpers'
import config from './config/config'
import { Toaster } from './components/ui/sonner'
import { FloatingActionMenu } from './components/navigation/FloatingActionMenu'
import { AIChatWidget } from './components/tako/components/AIChatWidget'
import { NavigationHints } from './components/common/NavigationHints'
import { UniversalViewerProvider, useUniversalViewer } from './contexts/UniversalViewerContext'
import { UniversalViewer } from './components/ui/universal-viewer/UniversalViewer'
import { ChatDrawer } from './components/chat'
import { useChatNotifications } from './hooks/useChatNotifications'
import BottomAdBanner from './components/common/BottomAdBanner' 
import './styles/mobile.css'

//to directly toggle to the chat interface
import { useTakoAIStore } from './stores/takoAIStore'


// Eager load critical components
import { LandingPage } from './components/home/LandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'
import AllAlerts from './pages/allAlerts'
import TestChatPage from './pages/TestChatPage'

// Helper function to wrap lazy imports with error handling and retry logic
const lazyWithRetry = (componentImport: () => Promise<any>, retries = 3) => {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const module = await componentImport();
        // Verify the module has a default export
        if (!module || (!module.default && Object.keys(module).length === 0)) {
          throw new Error('Module loaded but has no default export or exports');
        }
        return module;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Lazy load attempt ${i + 1}/${retries} failed:`, lastError.message);

        if (i === retries - 1) {
          // Last attempt failed, log detailed error and throw
          console.error('❌ All lazy load attempts failed:', {
            error: lastError.message,
            stack: lastError.stack,
            attempts: retries
          });
          throw lastError;
        }

        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Failed to load component after retries');
  });
};

// Lazy load page components for code splitting with retry logic
const OnboardingFlow = lazyWithRetry(() => import('./components/onboarding/OnboardingFlow'))
const FeedApp = lazyWithRetry(() => import('./components/feed/Feed').then(module => ({ default: module.Feed })))
const ScoutApp = lazyWithRetry(() => import('./components/scout/Scout'))
const BitesApp = lazyWithRetry(() => import('./components/bites/Bites'))
const TrimsApp = lazyWithRetry(() => import('./components/trims/Trims'))
// Dashboard merged into Plate - keeping import for backward compatibility but redirecting to /plate
const DashApp = lazyWithRetry(() => import('./components/plate/Plate'))
const SnapApp = lazyWithRetry(() => import('./components/snap/Snap').then(module => ({ default: module.Snap })))
const PlateApp: React.ComponentType<{ userId?: string; currentUser?: unknown }> = lazyWithRetry(() => import('./components/plate/Plate'))

// Helper component for navigation button
interface NavButtonProps {
  to: string;
  label: string;
}

// Wrapper component to pass location to PageErrorBoundary
function PageErrorBoundaryWithLocation({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Use key to force remount on route change, ensuring fresh error state
  return (
    <PageErrorBoundary key={location.pathname} location={location.pathname}>
      {children}
    </PageErrorBoundary>
  );
}

// Wrapper component for lazy-loaded routes with individual error boundaries
function LazyRouteWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 LazyRouteWrapper: Error loading route:', {
          path: location.pathname,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Suspense
        fallback={<PageLoader />}
      // Add timeout to prevent infinite loading
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

const NavButton = ({ to, label }: NavButtonProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isActive
          ? 'bg-white text-gray-900'
          : 'text-gray-900 hover:text-gray-900'
        }`}
      style={{
        backgroundColor: isActive ? undefined : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </Link>
  );
};

// Main App Layout Component
function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { viewerState, closeViewer, navigateViewer, deleteHandler } = useUniversalViewer()
  const { isOpen, toggleChat } = useTakoAIStore()

  
  // Enable chat notifications only if chat is enabled
  useChatNotifications(config.app?.features?.chatEnabled ?? false)

  // Check if current route should show navigation
  const showNavigation = !['/landing', '/auth', '/onboarding'].includes(location.pathname);
  const currentPage = location.pathname.slice(1) || 'landing';

  // Navigation component with auth context access
  const Navigation = () => {
    const { user, signOut } = useAuth();
    const { openChat: openDMChat, unreadCount } = useDMChatStore();

    const handleSignOut = async () => {
      try {
        console.log('🚪 Sign out requested from navigation');
        await signOut();
        toastHelpers.success('Successfully signed out');
        navigate('/landing');
        console.log('✅ Sign out completed');
      } catch (error) {
        console.error('❌ Sign out failed:', error);
        toastHelpers.error('Failed to sign out');
      }
    };

    return (
      <div className="flex items-center justify-between h-16 safe-area-top px-4">
        {/* Logo */}
        <Link to="/feed" className="flex items-center">
          <img src="/logo_mobile.png" alt="FUZO" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <NavButton to="/feed" label="Feed" />
          <NavButton to="/scout" label="Scout" />
          <NavButton to="/bites" label="Bites" />
          <NavButton to="/trims" label="Trims" />
          <NavButton to="/plate" label="Plate" />

          {/* DM Chat Button */}
          {config.app.features.chatEnabled && (
            <button
              onClick={openDMChat}
              className="relative px-4 py-2 rounded-full border-2 transition ml-2 hover:bg-orange-50"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-accent)',
              }}
              title="Messages"
              aria-label="Messages"
            >
              <MessageCircle className="h-4 w-4 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* AI Chat Button */}
          <button
            onClick={toggleChat}
            className="px-4 py-2 rounded-full transition ml-2"
            style={{
              backgroundColor: isOpen ? 'var(--color-secondary)' : 'transparent',
              color: 'var(--color-accent)'
            }}
            title="AI Assistant"
            aria-label="AI Assistant"
          >
            <i className="fa-solid fa-robot"></i>
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
                className="px-3 py-2 text-white font-semibold rounded-full transition flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Protected Plate component with userId passed as prop
  const PlateProtectedApp = () => {
    const { user } = useAuth();

    if (!user) {
      return null; // ProtectedRoute will handle redirect
    }

    return (
      <LazyRouteWrapper>
        <PlateApp userId={user.id} currentUser={user} />
      </LazyRouteWrapper>
    );
  };

  return (
    <div className="min-h-screen bg-background mobile-app-container">
      {/* Desktop Navigation - Only show on authenticated pages */}
      {showNavigation && (
        <div className="border-b sticky top-0 z-50 hidden md:block" style={{ backgroundColor: 'var(--menu-bg)' }}>
          <div className="container mx-auto px-4">
            <Navigation />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mobile-content-area">
        <PageErrorBoundaryWithLocation>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/landing" element={<LandingPage onNavigateToSignup={() => navigate('/auth')} />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/debug" element={<DebugApp />} />
            <Route path="/all-alerts" element={<AllAlerts />} />
            {config.app.features.chatEnabled && <Route path="/test-chat" element={<TestChatPage />} />}

            {/* Protected Routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <OnboardingFlow />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <FeedApp />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scout"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <ScoutApp />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bites"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <BitesApp />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trims"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <TrimsApp />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/snap"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <SnapApp />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dash"
              element={
                <ProtectedRoute>
                  <Navigate to="/plate" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plate"
              element={
                <ProtectedRoute>
                  <PlateProtectedApp />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </PageErrorBoundaryWithLocation>
      </div>

      {/* Mobile Floating Action Menu - Only show on main app pages */}
      {showNavigation && (
        <div className="md:hidden">
          <FloatingActionMenu
            currentPage={currentPage}
            onNavigate={(page) => {
              const path = page.startsWith('/') ? page : `/${page}`;
              navigate(path);
            }}
          />
        </div>
      )}

      {/* Mobile AI Chat Button - Top right floating button */}
      {showNavigation && (
        <button
          onClick={toggleChat}
          className="md:hidden fixed top-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg transition-all"
          style={{
            backgroundColor: isOpen ? 'var(--color-secondary)' : 'var(--color-accent)',
            border: '2px solid',
            borderColor: isOpen ? 'var(--color-secondary)' : 'var(--color-border)',
          }}
          aria-label="AI Assistant"
        >
          <i className={`fa-solid fa-robot ${isOpen ? 'text-white' : 'text-gray-700'}`}></i>
        </button>
      )}


      {/* Navigation Hints - Show helpful tips on each page */}
      {showNavigation && <NavigationHints />}

      {/* Toast Notifications */}
      <Toaster />

      {/* AI Chat Widget - Available on all authenticated pages */}
      {showNavigation && <AIChatWidget position="bottom-right" />}

      {/* Universal Viewer - Available app-wide */}
      <UniversalViewer
        state={viewerState}
        onClose={closeViewer}
        onNavigate={navigateViewer}
        onDelete={deleteHandler ? (itemId: string, itemType: string) => deleteHandler(itemId, itemType) : undefined}
      />

      {/* DM Chat Drawer - Only show if chat is enabled */}
      {config.app.features.chatEnabled && <ChatDrawer />}

      {/* Bottom Ad Banner - Show on all authenticated pages */}
      {showNavigation && (
        <BottomAdBanner 
          adSlot={import.meta.env.VITE_ADSENSE_SLOT_BOTTOM_BANNER}
          bannerImage="/ads/ad-banner.png"
        />
      )}
    </div>
  );
}

// Root App Component with Router
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <UniversalViewerProvider>
            <AppLayout />
          </UniversalViewerProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// ScrollToTop component to scroll to top on route changes
// Must be inside BrowserRouter to use useLocation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default App;
