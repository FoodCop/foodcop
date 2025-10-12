'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export function ChatIntegrationTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Check if user is authenticated
      results.auth = {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email
      };

      // Test 2: Test friends API
      try {
        const friendsResponse = await fetch('/api/chat/friends');
        const friendsData = await friendsResponse.json();
        results.friendsAPI = {
          status: friendsResponse.status,
          success: friendsData.success,
          friendsCount: friendsData.friends?.length || 0,
          error: friendsData.error
        };
      } catch (error: any) {
        results.friendsAPI = { error: error?.message || 'Unknown error' };
      }

      // Test 3: Test messages API
      try {
        const messagesResponse = await fetch('/api/chat/messages?roomId=general&limit=5');
        const messagesData = await messagesResponse.json();
        results.messagesAPI = {
          status: messagesResponse.status,
          success: messagesData.success,
          messagesCount: messagesData.messages?.length || 0,
          roomId: messagesData.roomId,
          error: messagesData.error
        };
      } catch (error: any) {
        results.messagesAPI = { error: error?.message || 'Unknown error' };
      }

      // Test 4: Test database connection via users API
      try {
        const usersResponse = await fetch('/api/debug/users');
        const usersData = await usersResponse.json();
        results.usersAPI = {
          status: usersResponse.status,
          usersCount: usersData.users?.length || 0,
          error: usersData.error
        };
      } catch (error: any) {
        results.usersAPI = { error: error?.message || 'Unknown error' };
      }

    } catch (error: any) {
      results.generalError = error?.message || 'Unknown error';
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      runTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h3>
        <p className="text-yellow-700">Please sign in to test the chat integration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Chat Integration Test</h2>
        <button 
          onClick={runTests} 
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {!isLoading && Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {/* Authentication Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              🔐 Authentication
              {testResults.auth?.authenticated ? (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">✓ PASS</span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">✗ FAIL</span>
              )}
            </h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResults.auth, null, 2)}
            </pre>
          </div>

          {/* Friends API Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              👥 Friends API
              {testResults.friendsAPI?.success ? (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">✓ PASS</span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">✗ FAIL</span>
              )}
            </h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResults.friendsAPI, null, 2)}
            </pre>
          </div>

          {/* Messages API Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              💬 Messages API
              {testResults.messagesAPI?.success ? (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">✓ PASS</span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">✗ FAIL</span>
              )}
            </h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResults.messagesAPI, null, 2)}
            </pre>
          </div>

          {/* Users API Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              👤 Users API
              {testResults.usersAPI?.usersCount > 0 ? (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">✓ PASS</span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">✗ FAIL</span>
              )}
            </h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResults.usersAPI, null, 2)}
            </pre>
          </div>

          {/* General Error */}
          {testResults.generalError && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-red-800">❌ General Error</h3>
              <p className="text-red-700">{testResults.generalError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}