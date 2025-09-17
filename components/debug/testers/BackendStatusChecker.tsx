import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { backendService } from './services/backendService';

export const BackendStatusChecker: React.FC = () => {
  const [status, setStatus] = useState<{
    backend: boolean;
    openai: boolean;
    googleMaps: boolean;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const serviceStatus = await backendService.checkServiceAvailability();
      setStatus(serviceStatus);
      
      console.log('🔧 Backend Status Check:', serviceStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to check backend status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = (isAvailable: boolean) => 
    isAvailable ? 'text-green-600' : 'text-red-600';

  const getStatusIcon = (isAvailable: boolean) => 
    isAvailable ? '✅' : '❌';

  if (loading && !status) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-800 text-sm">Checking backend status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-red-800">Backend Status Error</h3>
            <Button onClick={checkStatus} size="sm" variant="outline">
              Retry
            </Button>
          </div>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600">
            This usually means the Supabase edge function is not accessible from Figma Make.
          </p>
        </div>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className={`p-4 ${status.backend ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Backend Services</h3>
          <Button 
            onClick={checkStatus}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Supabase Edge Functions:</span>
            <span className={getStatusColor(status.backend)}>
              {getStatusIcon(status.backend)} {status.backend ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>OpenAI Integration:</span>
            <span className={getStatusColor(status.openai)}>
              {getStatusIcon(status.openai)} {status.openai ? 'Configured' : 'Not configured'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Google Maps Integration:</span>
            <span className={getStatusColor(status.googleMaps)}>
              {getStatusIcon(status.googleMaps)} {status.googleMaps ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>

        {status.backend && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-300">
            <p className="text-xs text-green-800 mb-2">
              🎉 <strong>Backend Connected!</strong> Your FUZO app is using Supabase edge functions.
            </p>
            <ul className="text-xs text-green-700 space-y-1">
              {status.openai && <li>• Tako AI assistant is working with real OpenAI</li>}
              {status.googleMaps && <li>• Google Maps providing real restaurant data</li>}
              {!status.openai && <li>• Configure OPENAI_API_KEY in Supabase for full AI</li>}
              {!status.googleMaps && <li>• Configure GOOGLE_MAPS_API_KEY in Supabase for real maps</li>}
            </ul>
          </div>
        )}

        {!status.backend && (
          <div className="p-3 bg-red-100 rounded-lg border border-red-300">
            <p className="text-xs text-red-800 mb-2">
              ❌ <strong>Backend Unavailable</strong>
            </p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• App is running in full demo mode with mock data</li>
              <li>• AI assistant uses fallback responses</li>
              <li>• Restaurant data is simulated</li>
              <li>• All features still work for demonstration</li>
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Last checked: {new Date(status.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};
