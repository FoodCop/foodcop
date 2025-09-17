import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
  action?: string;
}

export const DiagnosticsReport: React.FC = () => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  const runDiagnostics = () => {
    setIsRunning(true);
    const diagnostics: DiagnosticCheck[] = [];

    // 1. Check import.meta.env
    const importMetaKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
    diagnostics.push({
      name: 'import.meta.env Access',
      status: !!import.meta?.env ? 'pass' : 'fail',
      message: !!import.meta?.env ? 'import.meta.env is available' : 'import.meta.env is not available',
      details: import.meta?.env ? [
        `Mode: ${import.meta.env.MODE}`,
        `Dev: ${import.meta.env.DEV}`,
        `Base URL: ${import.meta.env.BASE_URL}`,
        `VITE vars count: ${Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).length}`
      ] : ['Environment object not found']
    });

    // 2. Check Google API Key via import.meta.env
    diagnostics.push({
      name: 'Google API Key (import.meta.env)',
      status: importMetaKey ? (importMetaKey.startsWith('AIza') ? 'pass' : 'warning') : 'fail',
      message: importMetaKey ? 
        (importMetaKey.startsWith('AIza') ? 'Valid Google API key found' : 'API key found but format may be invalid') :
        'Google API key not found in import.meta.env',
      details: importMetaKey ? [
        `Length: ${importMetaKey.length} characters`,
        `Preview: ${importMetaKey.substring(0, 12)}...`,
        `Starts with AIza: ${importMetaKey.startsWith('AIza') ? 'Yes' : 'No'}`
      ] : ['Key not found'],
      action: !importMetaKey ? 'Check your .env.local file and restart the dev server' : undefined
    });

    // 3. Check process.env
    const processKey = typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : undefined;
    diagnostics.push({
      name: 'Google API Key (process.env)',
      status: processKey ? 'pass' : 'warning',
      message: processKey ? 'Found in process.env' : 'Not found in process.env (this is normal in browser)',
      details: processKey ? [
        `Length: ${processKey.length} characters`,
        `Preview: ${processKey.substring(0, 12)}...`
      ] : ['Not available in browser environment']
    });

    // 4. Check Vite configuration
    const viteEnvVars = import.meta?.env ? Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')) : [];
    diagnostics.push({
      name: 'Vite Environment Loading',
      status: viteEnvVars.length > 0 ? 'pass' : 'fail',
      message: `Found ${viteEnvVars.length} VITE_ environment variables`,
      details: viteEnvVars.length > 0 ? viteEnvVars : ['No VITE_ variables found'],
      action: viteEnvVars.length === 0 ? 'Check your .env file and Vite configuration' : undefined
    });

    // 5. Check browser capabilities
    diagnostics.push({
      name: 'Browser Compatibility',
      status: 'pass',
      message: 'Browser features check',
      details: [
        `Fetch API: ${typeof fetch !== 'undefined' ? 'Available' : 'Not available'}`,
        `Local Storage: ${typeof localStorage !== 'undefined' ? 'Available' : 'Not available'}`,
        `Geolocation: ${'geolocation' in navigator ? 'Available' : 'Not available'}`,
        `User Agent: ${navigator.userAgent.substring(0, 50)}...`
      ]
    });

    // 6. Check Google Maps API functionality
    const finalKey = importMetaKey || processKey;
    if (finalKey && finalKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      diagnostics.push({
        name: 'Google Maps API Test',
        status: 'pass',
        message: 'API key configured and ready for testing',
        details: [
          `Key configured: Yes`,
          `Ready for Places API calls: Yes`,
          `Ready for Maps API calls: Yes`
        ]
      });
    } else {
      diagnostics.push({
        name: 'Google Maps API Test',
        status: 'fail',
        message: 'API key not properly configured',
        details: [
          'Cannot test API functionality without valid key'
        ],
        action: 'Configure VITE_GOOGLE_MAPS_API_KEY in your .env.local file'
      });
    }

    // 7. Check common issues
    const commonIssues = [];
    if (!finalKey) {
      commonIssues.push('No API key found in any environment source');
    }
    if (finalKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      commonIssues.push('API key is still using placeholder value');
    }
    if (finalKey && !finalKey.startsWith('AIza')) {
      commonIssues.push('API key format appears invalid (should start with "AIza")');
    }

    diagnostics.push({
      name: 'Common Issues Check',
      status: commonIssues.length === 0 ? 'pass' : 'warning',
      message: commonIssues.length === 0 ? 'No common issues detected' : `${commonIssues.length} potential issues found`,
      details: commonIssues.length > 0 ? commonIssues : ['All checks passed'],
      action: commonIssues.length > 0 ? 'Review the issues above and follow the suggested actions' : undefined
    });

    setChecks(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fail': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">🔧 FUZO Environment Diagnostics</h1>
        <p className="text-gray-600">Complete diagnostic report for Google API configuration</p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div>
          <Badge variant="secondary" className="mr-2">
            {checks.filter(c => c.status === 'pass').length} Passing
          </Badge>
          <Badge variant="destructive" className="mr-2">
            {checks.filter(c => c.status === 'fail').length} Failed
          </Badge>
          <Badge variant="outline">
            {checks.filter(c => c.status === 'warning').length} Warnings
          </Badge>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
          {isRunning ? 'Running...' : 'Re-run Diagnostics'}
        </Button>
      </div>

      <div className="space-y-4">
        {checks.map((check, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getStatusIcon(check.status)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-[#0B1F3A]">{check.name}</h3>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-gray-700 mb-2">{check.message}</p>
                
                {check.details && check.details.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <h4 className="font-medium text-sm text-gray-800 mb-1">Details:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {check.details.map((detail, i) => (
                        <li key={i} className="font-mono">• {detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {check.action && (
                  <Alert className="mt-2">
                    <AlertDescription>
                      <strong>Action needed:</strong> {check.action}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Quick Fix Guide</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Ensure your <code>.env.local</code> file exists in the project root</li>
          <li>Add: <code>VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE</code></li>
          <li>Restart your development server completely</li>
          <li>Clear browser cache and refresh</li>
          <li>Check that the API key starts with "AIza"</li>
        </ol>
      </div>
    </div>
  );
};
