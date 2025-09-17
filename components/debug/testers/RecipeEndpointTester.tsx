import React, { useState } from 'react';
import { backendService } from './services/backendService';

export function RecipeEndpointTester() {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const results: any = {};

    try {
      console.log('🧪 Testing recipe endpoints...');

      // Test basic health check
      console.log('1. Testing health check...');
      const healthResponse = await backendService.healthCheck();
      results.health = {
        success: healthResponse.success,
        data: healthResponse.data,
        error: healthResponse.error
      };

      // Test recipe search endpoint
      console.log('2. Testing recipe search...');
      const recipeResponse = await backendService.searchRecipes('pizza', '', '', '', 3);
      results.recipes = {
        success: recipeResponse.success,
        data: recipeResponse.data,
        error: recipeResponse.error
      };

      setTestResults(results);
      console.log('✅ Test results:', results);
    } catch (error) {
      console.error('❌ Test failed:', error);
      results.error = error.message;
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0B1F3A]">Recipe Backend Tester</h3>
        <button
          onClick={testEndpoints}
          disabled={testing}
          className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Endpoints'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-2">Health Check:</h4>
            <div className={`p-3 rounded ${testResults.health?.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${testResults.health?.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResults.health?.success ? '✅ Success' : '❌ Failed'}
              </p>
              {testResults.health?.data && (
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(testResults.health.data, null, 2)}
                </pre>
              )}
              {testResults.health?.error && (
                <p className="text-xs mt-2 text-red-600">{testResults.health.error}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-2">Recipe Search:</h4>
            <div className={`p-3 rounded ${testResults.recipes?.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${testResults.recipes?.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResults.recipes?.success ? '✅ Success' : '❌ Failed'}
              </p>
              {testResults.recipes?.data && (
                <div className="text-xs mt-2">
                  <p>Results: {testResults.recipes.data.results?.length || 0}</p>
                  {testResults.recipes.data.results?.[0] && (
                    <p>First recipe: {testResults.recipes.data.results[0].title}</p>
                  )}
                </div>
              )}
              {testResults.recipes?.error && (
                <p className="text-xs mt-2 text-red-600">{testResults.recipes.error}</p>
              )}
            </div>
          </div>

          {testResults.error && (
            <div className="p-3 bg-red-50 rounded">
              <p className="text-sm text-red-700">General Error: {testResults.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
