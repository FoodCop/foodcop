import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  location?: string; // Route path to detect route changes
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // Example: sendToErrorReporting(error, errorInfo);
    }
  }

  private readonly handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => globalThis.location.href = '/'}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page Error Boundary
 * Specialized error boundary for page-level errors with route-specific handling
 * Resets automatically when route changes
 */
interface PageErrorBoundaryState extends State {
  retryCount: number;
}

export class PageErrorBoundary extends Component<Props & { location?: string }, PageErrorBoundaryState> {
  public state: PageErrorBoundaryState = {
    hasError: false,
    error: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 PageErrorBoundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    console.error('📍 Error Message:', error.message);
    console.error('📍 Error Stack:', error.stack);
    this.props.onError?.(error, errorInfo);
    
    // Log error to console for debugging
    if (import.meta.env.DEV) {
      console.group('🔍 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Location:', this.props.location || 'unknown');
      console.groupEnd();
    }
    
    // Auto-retry with exponential backoff for transient errors
    // This helps with initialization race conditions
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = (attempt: number) => Math.min(500 * Math.pow(2, attempt), 3000);
    
    const attemptRetry = () => {
      if (retryCount < maxRetries && this.state.hasError) {
        retryCount++;
        console.log(`🔄 PageErrorBoundary: Auto-retry attempt ${retryCount}/${maxRetries}...`);
        setTimeout(() => {
          if (this.state.hasError) {
            this.setState({ hasError: false, error: null });
            // If still in error state after a moment, try again
            setTimeout(() => {
              if (this.state.hasError && retryCount < maxRetries) {
                attemptRetry();
              }
            }, 100);
          }
        }, retryDelay(retryCount - 1));
      }
    };
    
    attemptRetry();
  }

  // Reset error state when route changes
  public componentDidUpdate(prevProps: Props & { location?: string }) {
    if (prevProps.location !== this.props.location && this.state.hasError) {
      console.log('🔄 PageErrorBoundary: Route changed, resetting error state');
      this.setState({ hasError: false, error: null });
    }
  }

  // Also reset on mount if location changed (handles page refresh)
  public componentDidMount() {
    // Reset any stale error state on mount immediately
    // This prevents false errors from initialization race conditions
    if (this.state.hasError) {
      console.log('🔄 PageErrorBoundary: Component mounted, resetting error state immediately');
      console.log('📍 Current location:', this.props.location || 'unknown');
      this.setState({ hasError: false, error: null, retryCount: 0 });
    }
  }

  private readonly handleReset = () => {
    console.log('🔄 PageErrorBoundary: Manual reset triggered');
    this.setState({ hasError: false, error: null });
    // Try to go back, but if that fails, just reset the error state
    try {
      if (window.history.length > 1) {
        globalThis.history.back();
      } else {
        // If no history, just reset the error state
        console.log('🔄 PageErrorBoundary: No history to go back, just resetting error state');
      }
    } catch (e) {
      console.warn('⚠️ PageErrorBoundary: Could not go back in history:', e);
    }
  };

  private readonly handleRetry = () => {
    console.log('🔄 PageErrorBoundary: Retry button clicked');
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Page Error
              </h2>
              <p className="text-gray-600 mb-4">
                This page encountered an error. Let's get you back on track.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left bg-red-50 rounded p-3 mb-4 text-sm">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-red-700 overflow-auto whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
              >
                Retry
              </button>
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => globalThis.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
