'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HydrationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface HydrationErrorBoundaryProps {
  children: React.ReactNode;
}

export class HydrationErrorBoundary extends React.Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Check if this is a hydration error
    const isHydrationError = 
      error.message?.includes('Hydration failed') ||
      error.message?.includes('Text content does not match') ||
      error.message?.includes('Expected server HTML to contain');

    return { 
      hasError: true, 
      error: isHydrationError ? error : undefined 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HydrationErrorBoundary caught error:', error, errorInfo);
    
    // Log hydration errors differently
    if (error.message?.includes('Hydration failed')) {
      console.warn('Hydration mismatch detected - this may be normal during development');
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // For hydration errors, try to recover automatically
      if (this.state.error?.message?.includes('Hydration failed')) {
        // Auto-reload after a brief delay for hydration errors
        setTimeout(() => {
          this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        }, 100);
        
        // Show a minimal loading state
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Syncing...</p>
            </div>
          </div>
        );
      }

      // For other errors, show a proper error screen
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              There was an unexpected error. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm font-medium cursor-pointer">Error Details (Dev)</summary>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components that commonly have hydration issues
export function withHydrationProtection<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const ProtectedComponent = (props: P) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <div suppressHydrationWarning className="opacity-0">
          <Component {...props} />
        </div>
      );
    }

    return <Component {...props} />;
  };

  ProtectedComponent.displayName = displayName || `withHydrationProtection(${Component.displayName || Component.name})`;
  return ProtectedComponent;
}