import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  solution?: string;
}

export function SupabaseEdgeFunctionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setDiagnostics(prev => {
      const filtered = prev.filter(d => d.test !== result.test);
      return [...filtered, result];
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    // Test 1: Check if project info is available
    addResult({
      test: 'Project Configuration',
      status: 'pending',
      message: 'Checking project configuration...'
    });

    if (!projectId || !publicAnonKey) {
      addResult({
        test: 'Project Configuration',
        status: 'error',
        message: 'Missing project ID or anon key',
        solution: 'Ensure Supabase project is properly initialized'
      });
      setIsRunning(false);
      return;
    }

    addResult({
      test: 'Project Configuration',
      status: 'success',
      message: `Project ID: ${projectId.substring(0, 8)}...`,
      details: { projectId, hasAnonKey: !!publicAnonKey }
    });

    // Test 2: Check if Edge Function exists
    addResult({
      test: 'Edge Function Availability',
      status: 'pending',
      message: 'Checking if edge function is deployed...'
    });

    try {
      const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`;
      console.log('🔍 Testing edge function at:', edgeFunctionUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 503) {
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: '503 Service Unavailable - Edge function not deployed or not responding',
          details: { 
            status: response.status, 
            statusText: response.statusText,
            url: edgeFunctionUrl
          },
          solution: 'Deploy the edge function: `supabase functions deploy make-server-5976446e`'
        });
      } else if (response.status === 404) {
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: '404 Not Found - Edge function does not exist',
          details: { 
            status: response.status,
            url: edgeFunctionUrl
          },
          solution: 'Create and deploy the edge function in your Supabase project'
        });
      } else if (response.status === 401) {
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: '401 Unauthorized - Invalid authentication key',
          details: { status: response.status },
          solution: 'Check your SUPABASE_ANON_KEY environment variable'
        });
      } else if (!response.ok) {
        const errorText = await response.text();
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { 
            status: response.status, 
            statusText: response.statusText,
            error: errorText
          },
          solution: 'Check edge function logs in Supabase dashboard'
        });
      } else {
        const data = await response.json();
        addResult({
          test: 'Edge Function Availability',
          status: 'success',
          message: 'Edge function is responding correctly',
          details: data
        });

        // Test 3: Check service configurations within the edge function
        addResult({
          test: 'Service Configuration',
          status: 'pending',
          message: 'Checking service configurations...'
        });

        const services = data.services || {};
        const missingServices = [];
        const configuredServices = [];

        if (!services.openai_configured) {
          missingServices.push('OpenAI API key');
        } else {
          configuredServices.push('OpenAI');
        }

        if (!services.google_maps_configured) {
          missingServices.push('Google Maps API key');
        } else {
          configuredServices.push('Google Maps');
        }

        if (!services.supabase_configured) {
          missingServices.push('Supabase service role key');
        } else {
          configuredServices.push('Supabase');
        }

        if (!services.spoonacular_configured) {
          missingServices.push('Spoonacular API key');
        } else {
          configuredServices.push('Spoonacular');
        }

        if (missingServices.length > 0) {
          addResult({
            test: 'Service Configuration',
            status: 'warning',
            message: `Missing ${missingServices.length} service configuration(s)`,
            details: { 
              missing: missingServices, 
              configured: configuredServices,
              allServices: services
            },
            solution: `Set these environment variables in Supabase: ${missingServices.join(', ')}`
          });
        } else {
          addResult({
            test: 'Service Configuration',
            status: 'success',
            message: 'All services are properly configured',
            details: { configured: configuredServices, allServices: services }
          });
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: 'Request timeout - Edge function not responding',
          details: { error: 'Timeout after 10 seconds' },
          solution: 'Edge function may not be deployed or is experiencing issues'
        });
      } else {
        addResult({
          test: 'Edge Function Availability',
          status: 'error',
          message: `Network error: ${error.message}`,
          details: { error: error.message },
          solution: 'Check network connection and Supabase project status'
        });
      }
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasWarnings = diagnostics.some(d => d.status === 'warning');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🔧 Supabase Edge Function Diagnostics
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? '🔄 Running...' : '🔄 Re-run Tests'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {diagnostics.length > 0 && (
          <div className="p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Summary</h3>
            {hasErrors && (
              <div className="text-red-600 mb-2">
                ❌ <strong>Critical Issues Found:</strong> Your edge function is not working properly
              </div>
            )}
            {hasWarnings && !hasErrors && (
              <div className="text-yellow-600 mb-2">
                ⚠️ <strong>Configuration Issues:</strong> Some services are not configured
              </div>
            )}
            {!hasErrors && !hasWarnings && (
              <div className="text-green-600 mb-2">
                ✅ <strong>All Good:</strong> Your edge function is working correctly
              </div>
            )}
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{getStatusIcon(result.status)}</span>
                  <span className="font-medium">{result.test}</span>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{result.message}</p>
              
              {result.solution && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Solution:</strong> {result.solution}
                  </p>
                </div>
              )}
              
              {result.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {hasErrors && (
          <>
            <Separator />
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">🚨 Critical Issues Detected</h3>
              <p className="text-red-700 text-sm mb-3">
                Your Supabase Edge Function is not responding. This is likely because:
              </p>
              <ul className="text-red-700 text-sm space-y-1 mb-3">
                <li>• The edge function is not deployed to Supabase</li>
                <li>• Environment variables are not set in Supabase</li>
                <li>• The edge function name doesn't match</li>
              </ul>
              <div className="bg-white border border-red-300 rounded p-3">
                <p className="font-medium text-red-800 mb-2">Required Actions:</p>
                <ol className="text-red-700 text-sm space-y-1">
                  <li>1. Ensure you have the Supabase CLI installed</li>
                  <li>2. Deploy the edge function: <code className="bg-red-100 px-1 rounded">supabase functions deploy make-server-5976446e</code></li>
                  <li>3. Set environment variables in your Supabase project dashboard</li>
                  <li>4. Verify the function name matches "make-server-5976446e"</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {/* Environment Variables Guide */}
        <Separator />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">📋 Required Environment Variables</h3>
          <p className="text-blue-700 text-sm mb-3">
            These should be set in your Supabase project's Edge Function settings:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="font-mono bg-white p-2 rounded border">OPENAI_API_KEY</div>
            <div className="font-mono bg-white p-2 rounded border">GOOGLE_MAPS_API_KEY</div>
            <div className="font-mono bg-white p-2 rounded border">SPOONACULAR_API_KEY</div>
            <div className="font-mono bg-white p-2 rounded border">SUPABASE_URL</div>
            <div className="font-mono bg-white p-2 rounded border">SUPABASE_SERVICE_ROLE_KEY</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
