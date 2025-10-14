"use client";

import { LoginButton } from "@/components/auth/LoginButton";
import { SupabaseQuickSignIn } from "@/components/auth/SupabaseQuickSignIn";
import { CronDebugPanel } from "@/components/debug/CronDebugPanel";
import { Users } from "@/components/debug/Users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";

export default function AuthDebugPage() {
  const { user, loading } = useAuth();
  const [authState, setAuthState] = useState<any>(null);
  const [envVars, setEnvVars] = useState<any>({});
  const [supabaseConnection, setSupabaseConnection] = useState<boolean | null>(null);

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    });

    // Test Supabase connection
    testSupabaseConnection();
  }, []);

  useEffect(() => {
    setAuthState({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      } : null,
      loading,
      isAuthenticated: !!user
    });
  }, [user, loading]);

  const testSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/debug/supabase');
      const data = await response.json();
      setSupabaseConnection(data.success);
    } catch (error) {
      setSupabaseConnection(false);
    }
  };

  const testGoogleAuth = async () => {
    try {
      const response = await fetch('/api/debug/oauth');
      const data = await response.json();
      console.log('Google OAuth Test:', data);
      
      // Also test our comprehensive env check
      const envResponse = await fetch('/api/debug/env-vars');
      const envData = await envResponse.json();
      console.log('Environment Check:', envData);
      
      alert(`Google OAuth Status: ${data.success ? 'Connected' : 'Failed - ' + data.error}\n\nCheck console for full environment details.`);
    } catch (error) {
      console.error('OAuth test failed:', error);
      alert('OAuth test failed - check console for details');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Authentication & CRON Debug Center
        </h1>
        <p className="text-muted-foreground">
          Monitor authentication functionality and CRON job status
        </p>
      </div>

      {/* CRON Debug Panel */}
      <div className="mb-6">
        <CronDebugPanel />
      </div>

      {/* Users Debug Panel */}
      <div className="mb-6">
        <Users />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Custom Login Button:</h4>
                <div className="flex justify-center">
                  <LoginButton />
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Supabase Quick Sign-In:</h4>
                <SupabaseQuickSignIn compact={true} showUserInfo={true} />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Current Auth State:</h4>
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(authState, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment & Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Environment Variables:</h4>
                <div className="space-y-1 text-sm">
                  <div>Supabase URL: <span className={envVars.supabaseUrl?.includes('✓') ? 'text-green-600' : 'text-red-600'}>{envVars.supabaseUrl}</span></div>
                  <div>Supabase Anon Key: <span className={envVars.supabaseAnonKey?.includes('✓') ? 'text-green-600' : 'text-red-600'}>{envVars.supabaseAnonKey}</span></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Database Connection:</h4>
                <div className="text-sm">
                  Supabase: <span className={supabaseConnection ? 'text-green-600' : 'text-red-600'}>
                    {supabaseConnection === null ? 'Testing...' : supabaseConnection ? '✓ Connected' : '✗ Failed'}
                  </span>
                </div>
              </div>
              
              <Button onClick={testGoogleAuth} variant="outline" className="w-full">
                Test Google OAuth
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Tests */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Debug Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => window.open('/api/debug/supabase', '_blank')} 
                variant="outline"
              >
                Test Supabase
              </Button>
              
              <Button 
                onClick={() => window.open('/api/debug/oauth', '_blank')} 
                variant="outline"
              >
                Test OAuth
              </Button>
              
              <Button 
                onClick={() => window.open('/cron-debug', '_blank')} 
                variant="outline"
              >
                Full Debug
              </Button>
              
              <Button 
                onClick={testSupabaseConnection} 
                variant="outline"
              >
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}