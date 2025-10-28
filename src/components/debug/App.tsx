import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, Clock, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface APITestResult {
  service: string;
  status: 'loading' | 'success' | 'error' | 'not-tested';
  message: string;
  responseTime?: number;
  data?: unknown;
  error?: string;
}

interface EnvironmentVariable {
  key: string;
  value: string | undefined;
  isSecret: boolean;
  description: string;
}

export default function DebugApp() {
  const [testResults, setTestResults] = useState<Record<string, APITestResult>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Environment variables to check
  const getEnvVars = (): EnvironmentVariable[] => [
    {
      key: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      isSecret: false,
      description: 'Supabase project URL'
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      isSecret: true,
      description: 'Supabase anonymous key'
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      isSecret: true,
      description: 'Google Maps API key'
    },
    {
      key: 'VITE_GOOGLE_PLACES_API_KEY',
      value: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
      isSecret: true,
      description: 'Google Places API key'
    },
    {
      key: 'VITE_YOUTUBE_API_KEY',
      value: import.meta.env.VITE_YOUTUBE_API_KEY,
      isSecret: true,
      description: 'YouTube Data API key'
    },
    {
      key: 'VITE_OPENAI_API_KEY',
      value: import.meta.env.VITE_OPENAI_API_KEY,
      isSecret: true,
      description: 'OpenAI API key'
    },
    {
      key: 'VITE_SPOONACULAR_API_KEY',
      value: import.meta.env.VITE_SPOONACULAR_API_KEY,
      isSecret: true,
      description: 'Spoonacular Food API key'
    },
    {
      key: 'VITE_GOOGLE_CLIENT_ID',
      value: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      isSecret: false,
      description: 'Google OAuth Client ID'
    },
    {
      key: 'VITE_APP_URL',
      value: import.meta.env.VITE_APP_URL,
      isSecret: false,
      description: 'Application URL'
    }
  ];

  // Check if running on localhost
  useEffect(() => {
    const hostname = window.location.hostname;
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('172.'));
  }, []);

  // Initialize test results
  useEffect(() => {
    const envVars = getEnvVars();
    
    const initialResults: Record<string, APITestResult> = {};
    
    // Environment variable checks
    envVars.forEach(envVar => {
      initialResults[envVar.key] = {
        service: envVar.description,
        status: envVar.value ? 'success' : 'error',
        message: envVar.value ? 'Environment variable loaded' : 'Environment variable missing',
      };
    });

    // API service checks
    const apiServices = [
      'supabase-connection',
      'google-maps',
      'google-places', 
      'youtube-api',
      'openai-api',
      'spoonacular-api'
    ];

    apiServices.forEach(service => {
      initialResults[service] = {
        service: service.replace('-', ' ').toUpperCase(),
        status: 'not-tested',
        message: 'Click "Test API" to check connection'
      };
    });

    setTestResults(initialResults);
  }, []);

  // Mask sensitive values
  const maskValue = (value: string | undefined, isSecret: boolean, show: boolean): string => {
    if (!value) return 'Not set';
    if (!isSecret || show) return value;
    
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  };

  // Test Supabase connection
  const testSupabase = async () => {
    updateTestStatus('supabase-connection', 'loading');
    const startTime = Date.now();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials missing');
      }

      // Test basic connectivity
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        updateTestStatus('supabase-connection', 'success', 'Supabase connection successful', responseTime);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('supabase-connection', 'error', `Supabase connection failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Test Google Maps API
  const testGoogleMaps = async () => {
    updateTestStatus('google-maps', 'loading');
    const startTime = Date.now();

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Maps API key missing');
      }

      // Test Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key=${apiKey}`
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.status === 'OK') {
        updateTestStatus('google-maps', 'success', 'Google Maps API working', responseTime, data);
      } else {
        throw new Error(`API Error: ${data.error_message || data.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('google-maps', 'error', `Google Maps API failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Test Google Places API
  const testGooglePlaces = async () => {
    updateTestStatus('google-places', 'loading');
    const startTime = Date.now();

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Places API key missing');
      }

      // Test Google Places Text Search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+San+Francisco&key=${apiKey}`
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.status === 'OK') {
        updateTestStatus('google-places', 'success', `Found ${data.results?.length || 0} places`, responseTime, data);
      } else {
        throw new Error(`API Error: ${data.error_message || data.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('google-places', 'error', `Google Places API failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Test YouTube API
  const testYouTube = async () => {
    updateTestStatus('youtube-api', 'loading');
    const startTime = Date.now();

    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!apiKey) {
        throw new Error('YouTube API key missing');
      }

      // Test YouTube Search API
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=cooking+recipes&type=video&maxResults=5&key=${apiKey}`
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.items) {
        updateTestStatus('youtube-api', 'success', `Found ${data.items.length} videos`, responseTime, data);
      } else {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('youtube-api', 'error', `YouTube API failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Test OpenAI API
  const testOpenAI = async () => {
    updateTestStatus('openai-api', 'loading');
    const startTime = Date.now();

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key missing');
      }

      // Test OpenAI API with a simple completion
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "API test successful"' }],
          max_tokens: 10
        })
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.choices && data.choices[0]) {
        updateTestStatus('openai-api', 'success', 'OpenAI API working', responseTime, data);
      } else {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('openai-api', 'error', `OpenAI API failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Test Spoonacular API
  const testSpoonacular = async () => {
    updateTestStatus('spoonacular-api', 'loading');
    const startTime = Date.now();

    try {
      const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
      
      if (!apiKey) {
        throw new Error('Spoonacular API key missing');
      }

      // Test Spoonacular Recipe Search
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=pasta&number=5&apiKey=${apiKey}`
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.results) {
        updateTestStatus('spoonacular-api', 'success', `Found ${data.results.length} recipes`, responseTime, data);
      } else {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('spoonacular-api', 'error', `Spoonacular API failed: ${errorMessage}`, responseTime, undefined, errorMessage);
    }
  };

  // Update test status helper
  const updateTestStatus = (
    service: string, 
    status: APITestResult['status'], 
    message?: string, 
    responseTime?: number, 
    data?: unknown, 
    error?: string
  ) => {
    setTestResults(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        status,
        message: message || prev[service].message,
        responseTime,
        data,
        error
      }
    }));
  };

  // Test all APIs
  const testAllAPIs = async () => {
    if (!isLocalhost) {
      alert('API testing is only available on localhost for security reasons.');
      return;
    }

    await Promise.all([
      testSupabase(),
      testGoogleMaps(),
      testGooglePlaces(),
      testYouTube(),
      testOpenAI(),
      testSpoonacular()
    ]);
  };

  // Get status icon
  const getStatusIcon = (status: APITestResult['status']) => {
    switch (status) {
      case 'loading': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  if (!isLocalhost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            API Debug page is only available on localhost for security reasons.
            Current hostname: {window.location.hostname}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FUZO API Debug Dashboard</h1>
          <p className="text-gray-600">Test all API keys and environment variables for local development</p>
          <Badge variant="outline" className="mt-2">
            🔒 Localhost Only - {window.location.hostname}
          </Badge>
        </div>

        {/* Environment Variables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if all required environment variables are loaded</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showSecrets ? 'Hide' : 'Show'} Secrets
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getEnvVars().map((envVar) => (
                <div key={envVar.key} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{envVar.key}</h4>
                    {getStatusIcon(testResults[envVar.key]?.status || 'not-tested')}
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{envVar.description}</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                    {maskValue(envVar.value, envVar.isSecret, showSecrets)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>API Connection Tests</CardTitle>
              <CardDescription>Test actual API connectivity and responses</CardDescription>
            </div>
            <Button onClick={testAllAPIs} disabled={!isLocalhost}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Test All APIs
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(testResults)
                .filter(([key]) => !getEnvVars().find(env => env.key === key))
                .map(([key, result]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.service}</h4>
                      {getStatusIcon(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.responseTime && (
                      <p className="text-xs text-gray-500">Response: {result.responseTime}ms</p>
                    )}
                    {result.status === 'success' && result.data !== undefined && (
                      <Badge variant="outline" className="mt-2">
                        Data received ✓
                      </Badge>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600 mt-2">{result.error}</p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Individual API Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Individual API Tests</CardTitle>
            <CardDescription>Test each API service separately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <Button variant="outline" size="sm" onClick={testSupabase}>
                Supabase
              </Button>
              <Button variant="outline" size="sm" onClick={testGoogleMaps}>
                Google Maps
              </Button>
              <Button variant="outline" size="sm" onClick={testGooglePlaces}>
                Google Places
              </Button>
              <Button variant="outline" size="sm" onClick={testYouTube}>
                YouTube
              </Button>
              <Button variant="outline" size="sm" onClick={testOpenAI}>
                OpenAI
              </Button>
              <Button variant="outline" size="sm" onClick={testSpoonacular}>
                Spoonacular
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {['success', 'error', 'loading', 'not-tested'].map(status => {
                const count = Object.values(testResults).filter(result => result.status === status).length;
                return (
                  <div key={status} className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}