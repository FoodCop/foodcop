import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  source: string;
  message: string;
  details?: any;
}

export const ErrorLogger: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const addLog = (type: 'error' | 'warning' | 'info', source: string, message: string, details?: any) => {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      source,
      message,
      details
    };
    setLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  useEffect(() => {
    if (!isCapturing) return;

    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      addLog('error', 'console.error', args.join(' '), args);
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog('warning', 'console.warn', args.join(' '), args);
      originalWarn(...args);
    };

    // Capture specific API-related logs
    const apiKeywords = ['VITE_GOOGLE_MAPS_API_KEY', 'API', 'google', 'environment', 'env'];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (apiKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
        addLog('info', 'console.log', message, args);
      }
      originalConsoleLog(...args);
    };

    // Capture window errors
    const handleError = (event: ErrorEvent) => {
      addLog('error', 'window.error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', 'unhandledrejection', `Promise rejection: ${event.reason}`, event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Log current environment state
    addLog('info', 'ErrorLogger', 'Started capturing logs');
    
    // Test environment variable access
    try {
      const googleKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        addLog('info', 'env-check', `Google API key found: ${googleKey.substring(0, 12)}...`);
      } else {
        addLog('warning', 'env-check', 'Google API key not found in import.meta.env');
      }
    } catch (error) {
      addLog('error', 'env-check', `Error accessing environment: ${error}`);
    }

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isCapturing]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: logs
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuzo-error-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">🐛 FUZO Error Logger</h1>
        <p className="text-gray-600">Real-time error and warning capture for debugging</p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsCapturing(!isCapturing)} 
            variant={isCapturing ? "destructive" : "default"}
            size="sm"
          >
            {isCapturing ? 'Stop Capturing' : 'Start Capturing'}
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm">
            Clear Logs
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            Export Logs
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Badge variant="destructive">
            {logs.filter(log => log.type === 'error').length} Errors
          </Badge>
          <Badge variant="secondary">
            {logs.filter(log => log.type === 'warning').length} Warnings
          </Badge>
          <Badge variant="outline">
            {logs.filter(log => log.type === 'info').length} Info
          </Badge>
        </div>
      </div>

      {isCapturing && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">🟢 Actively capturing logs...</p>
          <p className="text-sm text-green-600">Try navigating to different pages or triggering API calls to see errors in real-time.</p>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No logs captured yet. Start capturing to see errors and warnings.</p>
          </Card>
        ) : (
          logs.map((log, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start space-x-3">
                <span className="text-xl">{getTypeIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getTypeColor(log.type)}>
                      {log.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.source}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 font-mono text-sm break-words">
                    {log.message}
                  </p>
                  
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        Show details
                      </summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">🎯 What to look for:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Environment variable access errors</li>
          <li>Google API configuration warnings</li>
          <li>Vite build or runtime errors</li>
          <li>API key validation messages</li>
          <li>Browser compatibility issues</li>
        </ul>
      </div>
    </div>
  );
};
