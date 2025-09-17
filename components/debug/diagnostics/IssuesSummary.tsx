import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';

export const IssuesSummary: React.FC = () => {
  const currentKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
  
  const issues = [
    {
      id: 'env-var-not-loading',
      title: 'Environment Variable Not Loading',
      severity: 'high' as const,
      description: 'VITE_GOOGLE_MAPS_API_KEY is not being read from .env files',
      currentStatus: !currentKey || currentKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
      causes: [
        'Vite development server not restarted after .env changes',
        'Incorrect .env file location (should be in project root)',
        'Environment variable name doesn\'t start with VITE_',
        'Browser cache preventing new environment variables from loading'
      ],
      solutions: [
        'Stop dev server (Ctrl+C) and restart with npm run dev',
        'Ensure .env.local file is in project root directory',
        'Clear browser cache and hard refresh (Ctrl+Shift+R)',
        'Check .env.local file format: VITE_GOOGLE_MAPS_API_KEY=your_key_here'
      ]
    },
    {
      id: 'api-key-format',
      title: 'API Key Format Issues',
      severity: 'medium' as const,
      description: 'Google API key format validation errors',
      currentStatus: currentKey && !currentKey.startsWith('AIza'),
      causes: [
        'Using wrong type of Google Cloud credential',
        'API key copied incorrectly with extra characters',
        'Using service account JSON instead of API key',
        'API key has been regenerated but not updated'
      ],
      solutions: [
        'Verify API key starts with "AIza" and is 35+ characters',
        'Re-copy API key from Google Cloud Console credentials page',
        'Ensure you\'re using an API Key, not OAuth client or service account',
        'Generate new API key if current one appears corrupted'
      ]
    },
    {
      id: 'cors-errors',
      title: 'CORS and API Access Errors',
      severity: 'medium' as const,
      description: 'Browser blocking API calls due to CORS policy',
      currentStatus: false, // This would need actual API testing to determine
      causes: [
        'API key doesn\'t have HTTP referrer restrictions configured',
        'Current domain not added to API key restrictions',
        'Using server-side API calls in client-side code',
        'Missing or incorrect API key in requests'
      ],
      solutions: [
        'Add HTTP referrer restrictions in Google Cloud Console',
        'Include localhost and your domain in API key restrictions',
        'Use Google Maps JavaScript API instead of REST API for client-side',
        'Test API key with simple Places API request'
      ]
    },
    {
      id: 'vite-config',
      title: 'Vite Configuration Issues',
      severity: 'low' as const,
      description: 'Vite not properly exposing environment variables',
      currentStatus: false, // Current config looks correct
      causes: [
        'envPrefix not configured correctly',
        'Environment variables not defined in Vite config',
        'Build mode vs development mode differences',
        'Missing environment directory configuration'
      ],
      solutions: [
        'Verify vite.config.ts has envPrefix: ["VITE_"]',
        'Check envDir is set to current directory',
        'Ensure environment variables are exposed to client',
        'Clear Vite cache directory and rebuild'
      ]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  const activeIssues = issues.filter(issue => issue.currentStatus);
  const resolvedIssues = issues.filter(issue => !issue.currentStatus);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">📋 FUZO Issues Summary</h1>
        <p className="text-gray-600">Complete overview of Google API configuration issues and solutions</p>
      </div>

      {/* Current Environment Status */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-[#0B1F3A] mb-3">🔍 Current Environment Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Environment Variables</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>VITE_GOOGLE_MAPS_API_KEY:</span>
                <Badge variant={currentKey ? "default" : "destructive"}>
                  {currentKey ? 'Found' : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Key format:</span>
                <Badge variant={currentKey?.startsWith('AIza') ? "default" : "destructive"}>
                  {currentKey?.startsWith('AIza') ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Key length:</span>
                <Badge variant="outline">
                  {currentKey?.length || 0} chars
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">System Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Development mode:</span>
                <Badge variant="outline">
                  {import.meta?.env?.DEV ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>import.meta.env:</span>
                <Badge variant={import.meta?.env ? "default" : "destructive"}>
                  {import.meta?.env ? 'Available' : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Vite mode:</span>
                <Badge variant="outline">
                  {import.meta?.env?.MODE || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Issues */}
      {activeIssues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-700 mb-4">🚨 Active Issues ({activeIssues.length})</h2>
          <div className="space-y-4">
            {activeIssues.map((issue) => (
              <Card key={issue.id} className="p-4 border-red-200">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-[#0B1F3A]">{issue.title}</h3>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{issue.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Possible Causes:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {issue.causes.map((cause, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Solutions:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {issue.solutions.map((solution, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">✅ Resolved Issues ({resolvedIssues.length})</h2>
          <div className="space-y-3">
            {resolvedIssues.map((issue) => (
              <Card key={issue.id} className="p-3 border-green-200 bg-green-50">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <h3 className="font-medium text-green-800">{issue.title}</h3>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    RESOLVED
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Quick Action Guide */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#0B1F3A] mb-3">🚀 Quick Fix Guide</h3>
        
        {activeIssues.length > 0 ? (
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Priority Action:</strong> You have {activeIssues.length} active issue(s) that need attention.
              Start with the highest severity issues first.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Great news!</strong> No active issues detected. Your Google API configuration appears to be working correctly.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Most Common Solutions:</h4>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>
              <strong>Restart Development Server:</strong> Stop with Ctrl+C, then run <code className="bg-gray-100 px-1 rounded">npm run dev</code>
            </li>
            <li>
              <strong>Check .env.local file:</strong> Ensure it exists in project root with correct format
            </li>
            <li>
              <strong>Clear Browser Cache:</strong> Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
            </li>
            <li>
              <strong>Verify API Key:</strong> Must start with "AIza" and be from Google Cloud Console
            </li>
          </ol>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <Button 
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-[#F14C35] hover:bg-[#A6471E]"
          >
            Refresh Page
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'envfixer' }));
            }}
          >
            Open Auto Fixer
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'diagnostics' }));
            }}
          >
            Run Diagnostics
          </Button>
        </div>
      </Card>
    </div>
  );
};
