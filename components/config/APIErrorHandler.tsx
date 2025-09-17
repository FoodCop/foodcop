import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

interface APIErrorHandlerProps {
  error?: {
    code?: string;
    message?: string;
    details?: string;
  };
  apiType: 'google-maps' | 'places' | 'stream-chat';
  onRetry?: () => void;
  children: React.ReactNode;
}

export function APIErrorHandler({ error, apiType, onRetry, children }: APIErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isBillingError = error?.code === 'BILLING_NOT_ENABLED' || 
                        error?.message?.includes('BillingNotEnabledMapError') ||
                        error?.message?.includes('billing');

  const isQuotaError = error?.code === 'OVER_QUERY_LIMIT' ||
                      error?.message?.includes('quota') ||
                      error?.message?.includes('limit');

  const isAuthError = error?.code === 'REQUEST_DENIED' ||
                     error?.message?.includes('API key') ||
                     error?.message?.includes('unauthorized');

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    } else {
      // Simple page refresh
      window.location.reload();
    }
  };

  const getErrorTitle = () => {
    if (isBillingError) return 'Billing Not Enabled';
    if (isQuotaError) return 'API Quota Exceeded';
    if (isAuthError) return 'API Authentication Error';
    return 'API Error';
  };

  const getErrorDescription = () => {
    if (isBillingError) {
      return 'Google Maps APIs require billing to be enabled, even for free tier usage.';
    }
    if (isQuotaError) {
      return 'You have exceeded the API usage limits for your project.';
    }
    if (isAuthError) {
      return 'There is an issue with your API key authentication.';
    }
    return 'An error occurred while connecting to the API.';
  };

  const getSolutionSteps = () => {
    if (isBillingError) {
      return [
        'Go to Google Cloud Console → Billing',
        'Add a payment method to your account',
        'Link billing account to your project',
        'Wait 5-10 minutes for changes to propagate',
        'Refresh this page'
      ];
    }
    if (isQuotaError) {
      return [
        'Go to Google Cloud Console → APIs & Services → Quotas',
        'Increase quotas or wait for quota reset',
        'Consider implementing request caching',
        'Monitor usage in Cloud Console'
      ];
    }
    if (isAuthError) {
      return [
        'Verify VITE_GOOGLE_MAPS_API_KEY in your .env file',
        'Check API key restrictions in Cloud Console',
        'Ensure all required APIs are enabled',
        'Verify domain restrictions allow your current URL'
      ];
    }
    return [
      'Check your internet connection',
      'Verify API configuration',
      'Try refreshing the page',
      'Check browser console for more details'
    ];
  };

  const getHelpLinks = () => {
    const links = [];
    
    if (isBillingError) {
      links.push({
        label: 'Enable Billing',
        url: 'https://console.cloud.google.com/billing',
        primary: true
      });
      links.push({
        label: 'Billing Documentation',
        url: 'https://cloud.google.com/billing/docs/how-to/modify-project',
        primary: false
      });
    }
    
    if (isQuotaError) {
      links.push({
        label: 'Manage Quotas',
        url: 'https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas',
        primary: true
      });
    }
    
    if (isAuthError) {
      links.push({
        label: 'API Keys Console',
        url: 'https://console.cloud.google.com/apis/credentials',
        primary: true
      });
    }

    // Always include general help
    links.push({
      label: 'Google Maps API Documentation',
      url: 'https://developers.google.com/maps/documentation',
      primary: false
    });

    return links;
  };

  // If no error, render children normally
  if (!error) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#0B1F3A] mb-1">{getErrorTitle()}</h3>
                <p className="text-gray-600">{getErrorDescription()}</p>
                {error.code && (
                  <code className="inline-block mt-2 text-sm bg-red-50 text-red-700 px-2 py-1 rounded">
                    Error Code: {error.code}
                  </code>
                )}
              </div>
            </div>
          </div>

          {/* Solution Steps */}
          <div className="p-6">
            <h4 className="font-bold text-gray-800 mb-4">How to Fix This:</h4>
            <ol className="space-y-2 mb-6">
              {getSolutionSteps().map((step, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="font-bold text-[#F14C35] text-sm mt-1">{index + 1}.</span>
                  <span className="text-gray-700 text-sm">{step}</span>
                </li>
              ))}
            </ol>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {getHelpLinks().map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    link.primary
                      ? 'bg-[#F14C35] text-white hover:bg-[#d63e2a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            {/* Retry Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                {showDetails ? 'Hide' : 'Show'} Error Details
              </button>
            </div>

            {/* Error Details */}
            {showDetails && error.message && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-2">Technical Details:</h5>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                  {error.message}
                  {error.details && `\n\nAdditional Details:\n${error.details}`}
                </pre>
              </div>
            )}
          </div>

          {/* Special Billing Warning */}
          {isBillingError && (
            <div className="bg-yellow-50 border-t border-yellow-200 p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-800 mb-2">Important Note About Billing</h5>
                  <p className="text-sm text-yellow-700 mb-3">
                    Google requires billing for Maps APIs even if you stay within free usage limits. 
                    New accounts get $200 in free credits, which should cover development needs.
                  </p>
                  <div className="text-xs text-yellow-600">
                    💡 Most FUZO development usage costs less than $5/month
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper hook to detect Google Maps API errors
export function useGoogleMapsErrorDetection() {
  const [error, setError] = useState<{ code?: string; message?: string; details?: string } | null>(null);

  useEffect(() => {
    const handleGoogleMapsError = (event: any) => {
      if (event.error && event.error.message) {
        const message = event.error.message;
        if (message.includes('BillingNotEnabledMapError')) {
          setError({
            code: 'BILLING_NOT_ENABLED',
            message: 'Google Maps billing is not enabled',
            details: message
          });
        } else if (message.includes('OVER_QUERY_LIMIT')) {
          setError({
            code: 'OVER_QUERY_LIMIT',
            message: 'API quota exceeded',
            details: message
          });
        } else if (message.includes('REQUEST_DENIED')) {
          setError({
            code: 'REQUEST_DENIED',
            message: 'API request denied - check API key',
            details: message
          });
        }
      }
    };

    // Listen for global errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('BillingNotEnabledMapError') || message.includes('Google Maps')) {
        setError({
          code: 'BILLING_NOT_ENABLED',
          message: 'Google Maps billing is not enabled',
          details: message
        });
      }
      originalConsoleError.apply(console, args);
    };

    // Listen for unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message) {
        const message = event.reason.message;
        if (message.includes('BillingNotEnabledMapError')) {
          setError({
            code: 'BILLING_NOT_ENABLED',
            message: 'Google Maps billing is not enabled',
            details: message
          });
        }
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const clearError = () => setError(null);

  return { error, clearError };
}
