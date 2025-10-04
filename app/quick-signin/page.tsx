'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function QuickSignIn() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const supabase = supabaseBrowser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration errors
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">✅ Signed In Successfully!</CardTitle>
            <CardDescription className="text-center">
              Welcome back to FUZO, {user.name || user.email}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{user.email}</span>
              </div>
              {user.name && (
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span>{user.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">{user.id.substring(0, 8)}...</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => window.location.href = '/feed'} 
                className="flex-1"
              >
                Go to Feed
              </Button>
              <Button 
                onClick={() => supabase.auth.signOut()} 
                variant="outline"
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🍽️ Welcome to FUZO</CardTitle>
          <CardDescription className="text-center">
            Sign in to discover amazing food experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#f97316', // Orange color to match FUZO branding
                    brandAccent: '#ea580c',
                  },
                },
              },
              className: {
                anchor: 'text-orange-600 hover:text-orange-700',
                button: 'bg-orange-600 hover:bg-orange-700 text-white',
                input: 'rounded-md border-gray-300',
              },
            }}
            providers={['google']}
            redirectTo={`${window.location.origin}/auth/callback`}
            onlyThirdPartyProviders
            showLinks={false}
            view="sign_in"
            theme="light"
          />
          
          <div className="mt-4 text-center text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}