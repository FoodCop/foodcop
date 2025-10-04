'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AuthCallbackTest() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runAuthTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Environment Variables
      const envResponse = await fetch('/api/debug/env-check');
      const envData = await envResponse.json();
      results.environment = envData;

      // Test 2: OAuth Configuration
      const oauthResponse = await fetch('/api/debug/oauth');
      const oauthData = await oauthResponse.json();
      results.oauth = oauthData;

      // Test 3: Supabase Connection
      const supabaseResponse = await fetch('/api/debug/supabase');
      const supabaseData = await supabaseResponse.json();
      results.supabase = supabaseData;

      // Test 4: Current Auth State
      results.currentUser = {
        authenticated: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name
        } : null
      };

      setTestResults(results);
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAuthTests();
  }, [user]);

  const testGoogleSignIn = async () => {
    try {
      const { signInWithGoogle } = await import('@/lib/auth/auth');
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      alert(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔐 Auth Flow Test Dashboard</CardTitle>
          <CardDescription>
            Test your authentication setup and debug any issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={testGoogleSignIn}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🚀 Test Google Sign In
            </Button>
            <Button 
              onClick={runAuthTests}
              variant="outline"
              disabled={loading}
            >
              {loading ? '🔄 Testing...' : '🔍 Run All Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current User Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Current User Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span className={testResults.currentUser?.authenticated ? 'text-green-600' : 'text-red-600'}>
                    {testResults.currentUser?.authenticated ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                {testResults.currentUser?.user && (
                  <>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-sm">{testResults.currentUser.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="text-sm">{testResults.currentUser.user.name || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌍 Environment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.environment?.envCheck && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Supabase URL:</span>
                    <span>{testResults.environment.envCheck.supabase?.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Google Client ID:</span>
                    <span>{testResults.environment.envCheck.google?.clientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Google Secret:</span>
                    <span>{testResults.environment.envCheck.google?.clientSecret}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OAuth Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 OAuth Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={testResults.oauth?.success ? 'text-green-600' : 'text-red-600'}>
                    {testResults.oauth?.success ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
                {testResults.oauth?.error && (
                  <div className="text-red-600 text-sm">
                    Error: {testResults.oauth.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supabase Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗄️ Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className={testResults.supabase?.success ? 'text-green-600' : 'text-red-600'}>
                    {testResults.supabase?.success ? '✅ Connected' : '❌ Failed'}
                  </span>
                </div>
                {testResults.supabase?.error && (
                  <div className="text-red-600 text-sm">
                    Error: {testResults.supabase.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {testResults.environment?.validationIssues?.length > 0 && (
        <Card className="mt-4 border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-700">⚠️ Configuration Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {testResults.environment.validationIssues.map((issue: string, index: number) => (
                <li key={index} className="text-yellow-700">{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}