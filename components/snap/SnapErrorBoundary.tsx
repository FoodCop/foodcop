'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class SnapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SNAP Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultSnapErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultSnapErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Camera Error</h2>
        <p className="text-muted-foreground mb-6">
          Something went wrong with the camera feature. This might be due to:
        </p>
        <ul className="text-sm text-muted-foreground mb-6 text-left space-y-1">
          <li>• Camera permissions not granted</li>
          <li>• Camera in use by another application</li>
          <li>• Browser compatibility issues</li>
          <li>• Network connectivity problems</li>
        </ul>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="text-sm font-medium cursor-pointer">Error Details (Dev)</summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
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
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}