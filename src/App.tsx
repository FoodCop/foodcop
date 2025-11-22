import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { PageLoader } from './components/common/PageLoader'
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import { MobileRadialNav } from './components/navigation/MobileRadialNav'
import { AIChatWidget } from './components/tako/components/AIChatWidget'
import './App.css'
import './styles/mobile.css'

// Eager load critical components
import { NewLandingPage } from './components/home/NewLandingPage'
import DebugApp from './components/debug/Debug'
import AuthPage from './components/auth/AuthPage'

// Lazy load page components for code splitting
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'))
const FeedApp = lazy(() => import('./components/feed/FeedNew').then(module => ({ default: module.FeedNew })))
const ScoutApp = lazy(() => import('./components/scout/ScoutNew'))
const BitesApp = lazy(() => import('./components/bites/BitesNewMobile'))
const TrimsApp = lazy(() => import('./components/trims/TrimsNew'))
const DashApp = lazy(() => import('./components/dash/components/DashboardNew').then(module => ({ default: module.DashboardNew })))
const SnapApp = lazy(() => import('./components/snap/SnapNew').then(module => ({ default: module.SnapNew })))
const PlateApp: React.ComponentType<{ userId?: string; currentUser?: unknown }> = lazy(() => import('./components/plate/PlateNew'))

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

const NavButton = ({ to, label }: NavButtonProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isActive
          ? 'bg-orange-600 text-white' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );
};

// Main App Layout Component
function AppLayout() {
  const [colorMode, setColorMode] = useState<'white' | 'yellow'>('white')
  const [showAIChat, setShowAIChat] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Apply color mode to CSS variable
  useEffect(() => {
    const backgroundColor = colorMode === 'yellow' ? '#FFD53B' : '#FAFAFA';
    document.documentElement.style.setProperty('--background', backgroundColor);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'white' ? 'yellow' : 'white');
  };

  // Check if current route should show navigation
  const showNavigation = !['/landing', '/auth', '/onboarding'].includes(location.pathname);
  const currentPage = location.pathname.slice(1) || 'landing';

  // Navigation component with auth context access
  const Navigation = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
      try {
        console.log('🚪 Sign out requested from navigation');
        await signOut();
        toast.success('Successfully signed out');
        navigate('/landing');
        console.log('✅ Sign out completed');
      } catch (error) {
        console.error('❌ Sign out failed:', error);
        toast.error('Failed to sign out');
      }
    };

    return (
      <div className="flex items-center justify-between h-16 safe-area-top px-4">
        {/* Logo */}
        <Link to="/feed" className="flex items-center">
          <img src="/logo_mobile.png" alt="FUZO" className="h-10" />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <NavButton to="/feed" label="Feed" />
          <NavButton to="/scout" label="Scout" />
          <NavButton to="/bites" label="Bites" />
          <NavButton to="/trims" label="Trims" />
          <NavButton to="/plate" label="Plate" />
          <NavButton to="/dash" label="Dashboard" />

          {/* Color Toggle Button */}
          <button
            onClick={toggleColorMode}
            className="px-4 py-2 rounded-full border-2 transition ml-2"
            style={{ 
              borderColor: colorMode === 'yellow' ? '#FFD53B' : '#FFFFFF',
              backgroundColor: colorMode === 'yellow' ? '#FFD53B' : '#FFFFFF',
              color: '#000000'
            }}
            title="Toggle Color Mode"
          >
            <i className="fa-solid fa-palette"></i>
          </button>

          {/* AI Chat Button */}
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="px-4 py-2 rounded-full border-2 transition ml-2"
            style={{ 
              borderColor: showAIChat ? '#3B82F6' : '#E5E7EB',
              backgroundColor: showAIChat ? '#3B82F6' : '#FFFFFF',
              color: showAIChat ? '#FFFFFF' : '#000000'
            }}
            title="AI Assistant"
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
                className="px-3 py-2 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-50 transition flex items-center space-x-2"
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

  // Protected Plate component with userId passed as prop
  const PlateProtectedApp = () => {
    const { user } = useAuth();
    
    if (!user) {
      return null; // ProtectedRoute will handle redirect
    }
    
    return (
      <Suspense fallback={<PageLoader />}>
        <PlateApp userId={user.id} currentUser={user} />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-background mobile-app-container">
      {/* Desktop Navigation - Only show on authenticated pages */}
      {showNavigation && (
        <div className="bg-white border-b sticky top-0 z-50 hidden md:block">
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
            <Route path="/landing" element={<NewLandingPage onNavigateToSignup={() => navigate('/auth')} />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/debug" element={<DebugApp />} />

            {/* Protected Routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <OnboardingFlow />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <FeedApp />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scout"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ScoutApp />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bites"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BitesApp />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trims"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <TrimsApp />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/snap"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SnapApp />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dash"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashApp />
                  </Suspense>
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
      
      {/* Mobile Radial Navigation - Only show on main app pages */}
      {showNavigation && (
        <div className="md:hidden">
          <MobileRadialNav
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
          onClick={() => setShowAIChat(!showAIChat)}
          className="md:hidden fixed top-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg transition-all"
          style={{
            backgroundColor: showAIChat ? '#3B82F6' : '#FFFFFF',
            border: '2px solid',
            borderColor: showAIChat ? '#3B82F6' : '#E5E7EB',
          }}
        >
          <i className={`fa-solid fa-robot ${showAIChat ? 'text-white' : 'text-gray-700'}`}></i>
        </button>
      )}
      
      {/* Toast Notifications */}
      <Toaster position="top-center" />

      {/* AI Chat Widget - Available on all authenticated pages */}
      {showNavigation && showAIChat && (
        <AIChatWidget position="top-right" />
      )}
    </div>
  );
}

// Root App Component with Router
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
