"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SupabaseQuickSignIn } from "@/components/auth/SupabaseQuickSignIn";
import { DebugService } from "../lib/debug-service";
import type { SystemHealth, DebugTestResult } from "../lib/types";

interface AuthenticationTabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function AuthenticationTab({ systemHealth, onRefresh }: AuthenticationTabProps) {
  const { user, loading: authLoading } = useAuth();
  const [testResults, setTestResults] = useState<DebugTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (systemHealth) {
      runAuthenticationTests();
    }
  }, [systemHealth]);

  const runAuthenticationTests = async () => {
    setLoading(true);
    try {
      const result = await DebugService.testAuthentication();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        message: "Authentication test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusVariant = (status: boolean | undefined) => {
    if (status === undefined) return "secondary";
    return status ? "default" : "destructive";
  };

  const handleTestSignIn = async () => {
    if (!testEmail) return;
    
    setLoading(true);
    try {
      // This would trigger a sign-in flow
      console.log("Testing sign-in for:", testEmail);
      // Add actual sign-in test logic here
    } catch (error) {
      console.error("Sign-in test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Authentication State */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Authentication State
              </CardTitle>
              <CardDescription>
                Your current authentication status and user information
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(!!user)}
                <div>
                  <h4 className="font-medium">Authentication Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {authLoading ? "Checking..." : user ? "Authenticated" : "Not authenticated"}
                  </p>
                </div>
                <Badge variant={getStatusVariant(!!user)}>
                  {user ? "Logged In" : "Logged Out"}
                </Badge>
              </div>
              
              {user && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>User ID:</strong> {user.id}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Name:</strong> {user.name || "Not set"}</div>
                  <div><strong>Avatar:</strong> {user.avatar_url ? "Set" : "Not set"}</div>
                  <div><strong>Provider:</strong> {(user as any)?.app_metadata?.provider || "Unknown"}</div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Quick Sign-In</h4>
              <SupabaseQuickSignIn compact={true} showUserInfo={false} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔐 Authentication Services
          </CardTitle>
          <CardDescription>
            Status of authentication providers and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.auth.supabaseAuth)}
                <div>
                  <h4 className="font-medium">Supabase Auth</h4>
                  <p className="text-sm text-muted-foreground">
                    Core authentication service
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(systemHealth.auth.supabaseAuth)}>
                {systemHealth.auth.supabaseAuth ? "Active" : "Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.auth.googleOAuth)}
                <div>
                  <h4 className="font-medium">Google OAuth</h4>
                  <p className="text-sm text-muted-foreground">
                    Google sign-in provider
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(systemHealth.auth.googleOAuth)}>
                {systemHealth.auth.googleOAuth ? "Configured" : "Not configured"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.auth.sessionValid)}
                <div>
                  <h4 className="font-medium">Session Validity</h4>
                  <p className="text-sm text-muted-foreground">
                    Current session status
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(systemHealth.auth.sessionValid)}>
                {systemHealth.auth.sessionValid ? "Valid" : "Invalid"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.environment.googleClientId && systemHealth.environment.googleClientSecret)}
                <div>
                  <h4 className="font-medium">OAuth Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Environment variables
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(systemHealth.environment.googleClientId && systemHealth.environment.googleClientSecret)}>
                {systemHealth.environment.googleClientId && systemHealth.environment.googleClientSecret ? "Complete" : "Missing"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Authentication Testing
          </CardTitle>
          <CardDescription>
            Test authentication flows and functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium">Test Authentication Flow</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter test email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={handleTestSignIn} disabled={loading || !testEmail}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={runAuthenticationTests}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Test All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/api/debug/oauth', '_blank')}
                  >
                    OAuth Debug
                  </Button>
                </div>
              </div>
            </div>
            
            {testResults && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Test Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.success)}
                    <span>{testResults.message}</span>
                  </div>
                  {testResults.error && (
                    <div className="text-red-600">Error: {testResults.error}</div>
                  )}
                  <div className="text-muted-foreground">
                    Tested at: {testResults.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Debug Information
          </CardTitle>
          <CardDescription>
            Raw authentication data for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">System Health Auth Data</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(systemHealth.auth, null, 2)}
              </pre>
            </div>
            
            {user && (
              <div>
                <h4 className="font-medium mb-2">Current User Data</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}