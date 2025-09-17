import React, { useState } from 'react';
import { ArrowLeft, Search, Loader, CheckCircle, XCircle } from 'lucide-react';
import { backendService } from './services/backendService';

interface SpoonacularTesterProps {
  onBack?: () => void;
}

export function SpoonacularTester({ onBack }: SpoonacularTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('chicken');

  const runHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🏥 Running backend health check...');
      const response = await backendService.healthCheck();
      setHealthStatus(response);
      console.log('✅ Health check response:', response);
    } catch (err: any) {
      console.error('❌ Health check failed:', err);
      setError(err.message || 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testSpoonacularAPI = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);
    try {
      console.log('🍽️ Testing Spoonacular API...');
      const response = await backendService.searchRecipes(searchQuery, '', '', '', 6);
      setTestResults(response);
      console.log('✅ Spoonacular test response:', response);
    } catch (err: any) {
      console.error('❌ Spoonacular API test failed:', err);
      setError(err.message || 'Spoonacular API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3A]">Spoonacular Tester</h1>
              <p className="text-sm text-gray-600">Test Spoonacular API integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Health Check Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">Backend Health Check</h2>
            <button
              onClick={runHealthCheck}
              disabled={isLoading}
              className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Check Health'}
            </button>
          </div>

          {healthStatus && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <StatusIcon status={healthStatus.success} />
                <span className="font-medium">Backend Status</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  healthStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.success ? 'Healthy' : 'Error'}
                </span>
              </div>

              {healthStatus.success && healthStatus.data?.services && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={healthStatus.data.services.spoonacular_configured} />
                    <span>Spoonacular API Key</span>
                    <span className="text-sm text-gray-600">
                      {healthStatus.data.services.spoonacular_key_preview || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={healthStatus.data.services.openai_configured} />
                    <span>OpenAI API Key</span>
                    <span className="text-sm text-gray-600">
                      {healthStatus.data.services.openai_key_preview || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={healthStatus.data.services.google_maps_configured} />
                    <span>Google Maps API Key</span>
                    <span className="text-sm text-gray-600">
                      {healthStatus.data.services.google_key_preview || 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recipe Search Test */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">Recipe Search Test</h2>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for recipes..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#F14C35] focus:ring-2 focus:ring-[#F14C35]/20"
                />
              </div>
              <button
                onClick={testSpoonacularAPI}
                disabled={isLoading}
                className="px-6 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Test Search</span>
              </button>
            </div>

            {testResults && (
              <div className="mt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <StatusIcon status={testResults.success} />
                  <span className="font-medium">
                    {testResults.success ? 'API Test Successful' : 'API Test Failed'}
                  </span>
                </div>

                {testResults.success && testResults.data ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Found {testResults.data.totalResults || testResults.data.results?.length || 0} recipes
                    </p>
                    
                    {testResults.data.results && testResults.data.results.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {testResults.data.results.slice(0, 6).map((recipe: any, index: number) => (
                          <div key={recipe.id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                            {recipe.image && (
                              <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            <h3 className="font-semibold text-sm text-[#0B1F3A] mb-1">
                              {recipe.title}
                            </h3>
                            <div className="text-xs text-gray-600 space-y-1">
                              {recipe.readyInMinutes && (
                                <p>⏱️ {recipe.readyInMinutes} mins</p>
                              )}
                              {recipe.servings && (
                                <p>👥 {recipe.servings} servings</p>
                              )}
                              {recipe.healthScore && (
                                <p>💚 Health: {recipe.healthScore}/100</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">Error Details:</p>
                    <p className="text-red-700 text-sm mt-1">
                      {testResults.error || 'Unknown error occurred'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">How to Test</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>First, run the health check to verify backend connectivity</li>
            <li>Look for the Spoonacular API Key status - it should show "configured" with a preview</li>
            <li>Enter a search term (e.g., "chicken", "pasta", "vegetarian") and click "Test Search"</li>
            <li>If successful, you should see real recipes from Spoonacular API</li>
            <li>If it fails but returns mock data, the API key may not be properly configured</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
