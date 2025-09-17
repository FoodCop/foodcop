import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { getEnvironmentInfo, logEnvironmentStatus, APP_ENV, FEATURES } from '../utils/env';
import { isGoogleAPIAvailable } from './config/apiConfig';

export const EnvironmentRefresher: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Refreshing environment variables...');
      
      // Force re-evaluation of environment
      window.location.reload();
      
    } catch (error) {
      console.error('Error refreshing environment:', error);
    } finally {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  const envInfo = getEnvironmentInfo();
  const hasApiKeys = FEATURES.GOOGLE_MAPS || FEATURES.AI_ASSISTANT;

  return (
    <Card className="p-4 bg-yellow-50 border-yellow-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-yellow-800">Environment Status</h3>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Runtime:</span>
            <span className="font-mono text-xs">
              {envInfo.runtime.isFigmaMake ? 'Figma Make' : envInfo.runtime.isVite ? 'Vite' : 'Other'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Google Maps API:</span>
            <span className={`text-xs ${FEATURES.GOOGLE_MAPS ? 'text-green-600' : 'text-red-600'}`}>
              {FEATURES.GOOGLE_MAPS ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>OpenAI API:</span>
            <span className={`text-xs ${FEATURES.AI_ASSISTANT ? 'text-green-600' : 'text-red-600'}`}>
              {FEATURES.AI_ASSISTANT ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
        </div>

        {!hasApiKeys && (
          <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
            <p className="text-xs text-yellow-800 mb-2">
              📤 If you just uploaded API keys, refresh to detect them:
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• API keys may take a moment to become available</li>
              <li>• Click "Refresh" button above to reload environment</li>
              <li>• Check browser console for detailed diagnostics</li>
            </ul>
          </div>
        )}

        {hasApiKeys && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-300">
            <p className="text-xs text-green-800">
              ✅ API keys detected! Your app is running with full functionality.
            </p>
          </div>
        )}

        {lastRefresh && (
          <div className="text-xs text-gray-500">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};
