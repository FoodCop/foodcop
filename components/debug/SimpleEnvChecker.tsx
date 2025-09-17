import React from 'react';
import { APP_ENV, FEATURES, getEnvironmentInfo } from '../utils/env';

/**
 * Universal Environment Checker
 * Works across Vite, Figma Make, and Vercel environments
 */
export const SimpleEnvChecker: React.FC = () => {
  const envInfo = getEnvironmentInfo();
  
  // Key environment variables to check
  const envChecks = [
    {
      name: 'Google Maps API',
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: APP_ENV.GOOGLE_MAPS_KEY,
      required: false,
      feature: FEATURES.GOOGLE_MAPS
    },
    {
      name: 'OpenAI API',
      key: 'VITE_OPENAI_API_KEY',
      value: APP_ENV.OPENAI_API_KEY,
      required: false,
      feature: FEATURES.AI_ASSISTANT
    },
    {
      name: 'Stream Chat API',
      key: 'VITE_STREAM_CHAT_API_KEY',
      value: APP_ENV.STREAM_CHAT_API_KEY,
      required: false,
      feature: FEATURES.STREAM_CHAT
    },
    {
      name: 'Supabase URL',
      key: 'VITE_SUPABASE_URL',
      value: APP_ENV.SUPABASE_URL,
      required: false,
      feature: FEATURES.SUPABASE
    }
  ];

  const configuredCount = envChecks.filter(check => check.feature).length;
  const totalCount = envChecks.length;

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h3 className="font-semibold mb-3 flex items-center space-x-2">
        <span>🔧</span>
        <span>Environment Status</span>
      </h3>
      
      {/* Runtime Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Runtime:</span>
            <span className="font-mono text-xs">
              {envInfo.runtime.isVite ? 'Vite' : envInfo.runtime.isFigmaMake ? 'Figma Make' : 'Other'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Environment:</span>
            <span className="font-mono text-xs">{envInfo.environment}</span>
          </div>
          <div className="flex justify-between">
            <span>Variables:</span>
            <span className="font-mono text-xs">{envInfo.variables.total} total</span>
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div className="space-y-2 mb-4">
        {envChecks.map((check, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{check.name}:</span>
            <div className="flex items-center space-x-2">
              <span className={check.feature ? 'text-green-600' : 'text-gray-400'}>
                {check.feature ? '✅' : '⚪'}
              </span>
              {check.value && (
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {check.value.length > 20 ? `${check.value.substring(0, 12)}...` : check.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className={`p-3 rounded-lg border ${
        configuredCount > 0 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          <span className={configuredCount > 0 ? 'text-green-600' : 'text-yellow-600'}>
            {configuredCount > 0 ? '✅' : '⚠️'}
          </span>
          <span className="font-medium">
            {configuredCount}/{totalCount} APIs Configured
          </span>
        </div>
        
        {configuredCount === 0 && (
          <div className="mt-2 text-sm text-yellow-700">
            <p>Running in demo mode with mock data.</p>
            <p className="mt-1">Configure environment variables for full functionality:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {!envInfo.runtime.isVite && (
                <>
                  <li>In Figma Make: Set variables in Project → Environment Variables</li>
                  <li>Add VITE_GOOGLE_MAPS_API_KEY for location features</li>
                  <li>Add VITE_OPENAI_API_KEY for AI assistant (testing only)</li>
                </>
              )}
              {envInfo.runtime.isVite && (
                <>
                  <li>Create .env.local file in project root</li>
                  <li>Add: VITE_GOOGLE_MAPS_API_KEY=your_key_here</li>
                  <li>Restart development server</li>
                </>
              )}
            </ul>
          </div>
        )}
        
        {configuredCount > 0 && (
          <div className="mt-2 text-sm text-green-700">
            <p>Great! You have {configuredCount} API{configuredCount > 1 ? 's' : ''} configured.</p>
            {configuredCount < totalCount && (
              <p>Configure the remaining APIs for even more features!</p>
            )}
          </div>
        )}
      </div>

      {/* Debug Information */}
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Import.meta available:</span>
          <span>{envInfo.runtime.isVite ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span>Window environment:</span>
          <span>{envInfo.runtime.hasWindow ? 'Available' : 'No'}</span>
        </div>
        {!envInfo.runtime.isVite && (
          <div className="text-yellow-600">
            <p>⚠️ Running in Figma Make preview mode</p>
            <p>Environment variables must be set in Figma Make UI</p>
          </div>
        )}
      </div>
    </div>
  );
};
