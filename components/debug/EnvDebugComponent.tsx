import React, { useEffect, useState } from 'react';
import { getEnvVar, hasEnvVar } from './utils/envUtils.basic';
import { API_CONFIG } from './config/apiConfig';

export const EnvDebugComponent: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 Environment Debug Component - Comprehensive Check...');
    
    // Direct access attempts
    const importMetaEnv = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
    const processEnv = typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : undefined;
    
    // Using our utility functions
    const utilityResult = getEnvVar('VITE_GOOGLE_MAPS_API_KEY', 'NOT_FOUND');
    const hasKey = hasEnvVar('VITE_GOOGLE_MAPS_API_KEY');
    
    // From API config
    const apiConfigKey = API_CONFIG.GOOGLE_API_KEY;
    
    // Additional debug info
    const allViteVars = Object.entries(import.meta?.env || {}).filter(([key]) => key.startsWith('VITE_'));
    const expectedKey = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
    
    const info = {
      timestamp: new Date().toISOString(),
      importMetaEnv,
      processEnv,
      utilityResult,
      hasKey,
      apiConfigKey,
      keyIsPlaceholder: apiConfigKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE",
      keyIsExpected: apiConfigKey === expectedKey,
      keyStartsCorrectly: apiConfigKey?.startsWith('AIza') || false,
      allImportMetaEnv: import.meta?.env,
      allViteVars,
      envMode: import.meta?.env?.MODE,
      envDev: import.meta?.env?.DEV,
      nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'N/A',
      viteConfigLoaded: !!import.meta?.env,
      userAgent: navigator.userAgent,
      location: window.location.href,
      // Diagnostic checks
      diagnostics: {
        importMetaExists: !!import.meta?.env,
        processExists: typeof process !== 'undefined',
        envKeysCount: allViteVars.length,
        hasExpectedKey: !!importMetaEnv || !!processEnv,
        keyResolution: importMetaEnv ? 'import.meta.env' : processEnv ? 'process.env' : 'fallback/hardcoded'
      }
    };
    
    console.log('🔍 Complete Environment Debug:', info);
    setDebugInfo(info);
  }, []);

  if (!debugInfo) return <div>Loading debug info...</div>;

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Environment Variables Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">Import Meta Env</h3>
            <code className="text-xs break-all">
              {debugInfo.importMetaEnv ? 
                `${debugInfo.importMetaEnv.substring(0, 15)}...` : 
                'Not found'
              }
            </code>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">Process Env</h3>
            <code className="text-xs break-all">
              {debugInfo.processEnv ? 
                `${debugInfo.processEnv.substring(0, 15)}...` : 
                'Not found'
              }
            </code>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">Utility Result</h3>
            <code className="text-xs break-all">
              {debugInfo.utilityResult !== 'NOT_FOUND' ? 
                `${debugInfo.utilityResult.substring(0, 15)}...` : 
                'NOT_FOUND'
              }
            </code>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">API Config Key</h3>
            <code className="text-xs break-all">
              {debugInfo.apiConfigKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" ? 
                `${debugInfo.apiConfigKey.substring(0, 15)}...` : 
                'PLACEHOLDER'
              }
            </code>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">Has Key</h3>
            <span className={debugInfo.hasKey ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.hasKey ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm">Is Placeholder</h3>
            <span className={!debugInfo.keyIsPlaceholder ? 'text-green-600' : 'text-red-600'}>
              {!debugInfo.keyIsPlaceholder ? '✅ Real Key' : '❌ Placeholder'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">Environment Info</h3>
        <div className="text-xs space-y-1">
          <div>Mode: {debugInfo.envMode}</div>
          <div>Dev: {String(debugInfo.envDev)}</div>
          <div>Node Env: {debugInfo.nodeEnv}</div>
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">🔍 Diagnostic Summary</h3>
          <div className="text-xs space-y-1">
            <div>Resolution Method: {debugInfo.diagnostics?.keyResolution}</div>
            <div>Expected Key Match: {debugInfo.keyIsExpected ? '✅ Yes' : '❌ No'}</div>
            <div>Valid Format: {debugInfo.keyStartsCorrectly ? '✅ Yes' : '❌ No'}</div>
            <div>VITE vars found: {debugInfo.diagnostics?.envKeysCount || 0}</div>
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">🛠️ Troubleshooting Steps</h3>
          <div className="text-xs space-y-1">
            <div>1. Run: <code className="bg-gray-200 px-1 rounded">node check-env.js</code></div>
            <div>2. Restart dev server completely</div>
            <div>3. Clear browser cache (Ctrl+Shift+Delete)</div>
            <div>4. Check .env file is in project root</div>
            <div>5. Verify no spaces around = in .env</div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">🐛 Raw Debug Data</h3>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
