import React, { useState, useEffect } from 'react';
import { API_CONFIG } from './config/apiConfig';
import { getEnvVar, hasEnvVar } from './utils/envUtils.basic';

interface EnvCheck {
  name: string;
  key: string;
  value: string | undefined;
  isRequired: boolean;
  status: 'missing' | 'present' | 'invalid';
  description: string;
}

export const EnvironmentDiagnostic: React.FC = () => {
  const [envChecks, setEnvChecks] = useState<EnvCheck[]>([]);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    const checks: EnvCheck[] = [
      {
        name: 'Google Maps API Key',
        key: 'VITE_GOOGLE_MAPS_API_KEY',
        value: getEnvVar('VITE_GOOGLE_MAPS_API_KEY'),
        isRequired: true,
        status: 'missing',
        description: 'Required for Google Maps, Places API, and location services'
      },
      {
        name: 'Stream Chat API Key',
        key: 'VITE_STREAM_CHAT_API_KEY',
        value: getEnvVar('VITE_STREAM_CHAT_API_KEY'),
        isRequired: false,
        status: 'missing',
        description: 'Required for real-time messaging features'
      },
      {
        name: 'Google Client ID',
        key: 'VITE_GOOGLE_CLIENT_ID',
        value: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
        isRequired: false,
        status: 'missing',
        description: 'Required for Google OAuth login'
      },
      {
        name: 'App Environment',
        key: 'VITE_ENVIRONMENT',
        value: getEnvVar('VITE_ENVIRONMENT'),
        isRequired: false,
        status: 'missing',
        description: 'App environment mode'
      }
    ];

    // Update status for each check
    checks.forEach(check => {
      const value = check.value;
      if (!value || value === '' || value.includes('YOUR_') || value.includes('_HERE')) {
        check.status = 'missing';
      } else if (check.key === 'VITE_GOOGLE_MAPS_API_KEY' && !value.startsWith('AIza')) {
        check.status = 'invalid';
      } else {
        check.status = 'present';
      }
    });

    setEnvChecks(checks);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✅';
      case 'invalid': return '⚠️';
      case 'missing': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'invalid': return 'text-yellow-600';
      case 'missing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const requiredMissing = envChecks.filter(check => check.isRequired && check.status !== 'present').length;
  const totalPresent = envChecks.filter(check => check.status === 'present').length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F14C35] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">Environment Diagnostic</h1>
          <p className="text-gray-600">Check your environment variable configuration</p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#F14C35]">{totalPresent}</div>
              <div className="text-sm text-gray-600">Variables Configured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{requiredMissing}</div>
              <div className="text-sm text-gray-600">Required Missing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0B1F3A]">{envChecks.length}</div>
              <div className="text-sm text-gray-600">Total Checked</div>
            </div>
          </div>
        </div>

        {/* Environment Variables List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#0B1F3A]">Environment Variables</h2>
            <button
              onClick={() => setShowValues(!showValues)}
              className="px-3 py-1 text-sm bg-[#F14C35] text-white rounded-lg hover:bg-[#A6471E] transition-colors"
            >
              {showValues ? 'Hide Values' : 'Show Values'}
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {envChecks.map((check, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getStatusIcon(check.status)}</span>
                      <h3 className="font-medium text-[#0B1F3A]">{check.name}</h3>
                      {check.isRequired && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Required</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{check.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Variable:</span>
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs">{check.key}</code>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={getStatusColor(check.status)}>
                          {check.status === 'present' && 'Configured'}
                          {check.status === 'invalid' && 'Invalid Format'}
                          {check.status === 'missing' && 'Missing or Default'}
                        </span>
                      </div>

                      {showValues && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">Value:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs max-w-md truncate">
                            {check.value ? 
                              (check.value.length > 20 ? `${check.value.substring(0, 20)}...` : check.value) 
                              : 'Not set'}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Fixes */}
        {requiredMissing > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-red-800 mb-3">🚨 Action Required</h3>
            <div className="space-y-3 text-sm text-red-700">
              <p>You have {requiredMissing} required environment variable(s) missing. Here's how to fix them:</p>
              
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Create or edit your <code className="bg-red-100 px-1 rounded">.env</code> file in the project root</li>
                <li>Add the missing variables in this format: <code className="bg-red-100 px-1 rounded">VARIABLE_NAME=your_value_here</code></li>
                <li>Make sure there are no quotes around the values</li>
                <li>Restart your development server</li>
              </ol>

              <div className="mt-4 p-3 bg-red-100 rounded-lg">
                <p className="font-medium mb-2">Example .env format:</p>
                <pre className="text-xs overflow-x-auto">
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
VITE_STREAM_CHAT_API_KEY=your_stream_chat_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {requiredMissing === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-semibold text-green-800 mb-2">All Required Variables Configured!</h3>
            <p className="text-green-700">Your environment is properly set up and ready to use all FUZO features.</p>
          </div>
        )}

        {/* Current API Config Debug */}
        <details className="bg-gray-50 rounded-xl p-6">
          <summary className="font-medium text-[#0B1F3A] cursor-pointer mb-4">Advanced Debug Information</summary>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">API Configuration Object:</h4>
              <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                {JSON.stringify({
                  GOOGLE_API_KEY: API_CONFIG.GOOGLE_API_KEY ? `${API_CONFIG.GOOGLE_API_KEY.substring(0, 20)}...` : 'Not set',
                  USE_GOOGLE_APIS: API_CONFIG.USE_GOOGLE_APIS,
                  DEFAULT_LOCATION: API_CONFIG.DEFAULT_LOCATION
                }, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Environment Detection:</h4>
              <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                {JSON.stringify({
                  'import.meta.env available': typeof import.meta !== 'undefined' && !!import.meta.env,
                  'process.env available': typeof process !== 'undefined' && !!process.env,
                  'VITE_GOOGLE_MAPS_API_KEY': hasEnvVar('VITE_GOOGLE_MAPS_API_KEY')
                }, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default EnvironmentDiagnostic;
