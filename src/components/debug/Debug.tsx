import { useState } from 'react';

interface EnvCheck {
  key: string;
  value: string | undefined;
  description: string;
  isSecret: boolean;
}

export default function DebugApp() {
  const [showSecrets, setShowSecrets] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  // Check if we're on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.hostname.startsWith('172.');

  // Environment variables to check
  const envChecks: EnvCheck[] = [
    {
      key: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      description: 'Supabase Project URL',
      isSecret: false
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      description: 'Supabase Anonymous Key',
      isSecret: true
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      description: 'Google Maps API Key',
      isSecret: true
    },
    {
      key: 'VITE_YOUTUBE_API_KEY',
      value: '(Server-side only)',
      description: 'YouTube API Key - Stored in Supabase Edge Function',
      isSecret: false
    },
    {
      key: 'VITE_SPOONACULAR_API_KEY',
      value: import.meta.env.VITE_SPOONACULAR_API_KEY,
      description: 'Spoonacular Food API Key',
      isSecret: true
    },
    {
      key: 'VITE_GOOGLE_CLIENT_ID',
      value: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      description: 'Google OAuth Client ID',
      isSecret: false
    },
    {
      key: 'VITE_APP_URL',
      value: import.meta.env.VITE_APP_URL,
      description: 'Application URL',
      isSecret: false
    },
    {
      key: 'VITE_STREAM_CHAT_API_KEY',
      value: import.meta.env.VITE_STREAM_CHAT_API_KEY,
      description: 'Stream Chat API Key',
      isSecret: true
    }
  ];

  // Mask sensitive values
  const maskValue = (value: string | undefined, isSecret: boolean): string => {
    if (!value) return '❌ NOT SET';
    if (!isSecret || showSecrets) return value;
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  };

  // Test individual APIs
  const testAPI = async (apiName: string, testFn: () => Promise<string>) => {
    setTestResults(prev => ({ ...prev, [apiName]: 'Testing...' }));
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [apiName]: `✅ ${result}` }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(prev => ({ ...prev, [apiName]: `❌ ${errorMsg}` }));
    }
  };

  // API Test Functions
  const testSupabase = async (): Promise<string> => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) throw new Error('Supabase credentials missing');
    
    const response = await fetch(`${url}/rest/v1/`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return 'Connected successfully';
  };

  const testGoogleMaps = async (): Promise<string> => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) throw new Error('Google Maps API key missing');
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key=${key}`
    );
    const data = await response.json();
    
    if (data.status !== 'OK') throw new Error(data.error_message || data.status);
    return `Found ${data.results?.length || 0} results`;
  };

  const testGooglePlaces = async (): Promise<string> => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Use same key as Google Maps
    if (!key) throw new Error('Google Maps API key missing (used for Places)');
    
    // Google Places API has CORS restrictions for direct REST calls from browser
    // This is normal - Places API is designed to be used via JavaScript SDK
    // We'll test by validating the API key format and availability
    
    if (!key.startsWith('AIza')) {
      throw new Error('Invalid Google API key format');
    }
    
    // In a real app, you would use the Google Places JavaScript library:
    // https://developers.google.com/maps/documentation/javascript/places
    return '✅ Google Places API key configured (use JavaScript SDK in production)';
  };

  const testYouTube = async (): Promise<string> => {
    // YouTube API uses server-side proxy via Supabase Edge Function
    // No client-side key needed
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-proxy`;
    
    const response = await fetch(
      `${proxyUrl}?action=search&q=cooking&maxResults=5`,
      {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      }
    );
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error || 'YouTube API request failed');
    return `Found ${data.data?.items?.length || 0} videos via proxy`;
  };

  const testSpoonacular = async (): Promise<string> => {
    const key = import.meta.env.VITE_SPOONACULAR_API_KEY;
    if (!key) throw new Error('Spoonacular API key missing');
    
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=pasta&number=5&apiKey=${key}`
    );
    const data = await response.json();
    
    if (data.message) throw new Error(data.message);
    return `Found ${data.results?.length || 0} recipes`;
  };



  if (!isLocalhost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🔒</div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600">
              API Debug page is only available on localhost for security reasons.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Current hostname: {window.location.hostname}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-utility p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">🔧 FUZO API Debug Dashboard</h1>
          <p className="text-gray-600">Verify all API keys and environment variables are loading correctly</p>
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mt-2">
            🔒 Localhost Only - {window.location.hostname}
          </div>
        </div>

        {/* Environment Variables Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Environment Variables</h2>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showSecrets ? '🙈 Hide' : '👁️ Show'} Secrets
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {envChecks.map((env) => (
              <div key={env.key} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">
                    {env.value ? '✅' : '❌'}
                  </span>
                  <h3 className="font-medium text-sm">{env.key}</h3>
                </div>
                <p className="text-xs text-gray-600 mb-2">{env.description}</p>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                  {maskValue(env.value, env.isSecret)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Tests Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">API Connection Tests</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Google Places API blocks direct REST calls from browsers (CORS policy). 
              In production, use the Google Places JavaScript library instead.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'Supabase', fn: testSupabase, key: 'supabase' },
              { name: 'Google Maps', fn: testGoogleMaps, key: 'google-maps' },
              { name: 'Google Places', fn: testGooglePlaces, key: 'google-places' },
              { name: 'YouTube', fn: testYouTube, key: 'youtube' },
              { name: 'Spoonacular', fn: testSpoonacular, key: 'spoonacular' }
            ].map((api) => (
              <div key={api.key} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{api.name} API</h3>
                <button
                  onClick={() => testAPI(api.key, api.fn)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-2"
                >
                  Test {api.name}
                </button>
                <div className="text-sm">
                  {testResults[api.key] || 'Click to test'}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              [
                { name: 'supabase', fn: testSupabase },
                { name: 'google-maps', fn: testGoogleMaps },
                { name: 'google-places', fn: testGooglePlaces },
                { name: 'youtube', fn: testYouTube },
                { name: 'spoonacular', fn: testSpoonacular }
              ].forEach(api => testAPI(api.name, api.fn));
            }}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🚀 Test All APIs
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {envChecks.filter(env => env.value).length}
              </div>
              <div className="text-sm text-gray-600">Environment Variables Set</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                {envChecks.filter(env => !env.value).length}
              </div>
              <div className="text-sm text-gray-600">Missing Variables</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {Object.values(testResults).filter(result => result.startsWith('✅')).length}
              </div>
              <div className="text-sm text-gray-600">Successful API Tests</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">
                {Object.values(testResults).filter(result => result.startsWith('❌')).length}
              </div>
              <div className="text-sm text-gray-600">Failed API Tests</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🚨 This debug page is only accessible on localhost for security</p>
          <p>All API keys are masked by default - click "Show Secrets" to reveal</p>
        </div>
      </div>
    </div>
  );
}