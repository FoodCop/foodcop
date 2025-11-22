import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PageLoader } from './PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that checks authentication before rendering children
 * Redirects to /auth if user is not authenticated
 */
export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <PageLoader />;
  }

  // If auth is required but user is not authenticated, redirect to auth
  if (requireAuth && (!user || !session)) {
    console.log('🚫 ProtectedRoute: User not authenticated, redirecting to /auth');
    // Store the current location so we can redirect back after auth
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated or route doesn't require auth
  return <>{children}</>;
}

