'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface SupabaseQuickSignInProps {
  redirectTo?: string;
  showUserInfo?: boolean;
  compact?: boolean;
}

export function SupabaseQuickSignIn({ 
  redirectTo = '/feed', 
  showUserInfo = true, 
  compact = false 
}: SupabaseQuickSignInProps) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const supabase = supabaseBrowser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (user) {
    if (!showUserInfo) {
      return (
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = redirectTo} 
            size="sm"
          >
            Continue
          </Button>
          <Button 
            onClick={() => supabase.auth.signOut()} 
            variant="outline"
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${compact ? 'max-w-sm' : ''}`}>
        <div className="text-center">
          <div className="text-green-600 font-medium">✅ Signed in as {user.name || user.email}</div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = redirectTo} 
            size="sm"
            className="flex-1"
          >
            Continue to App
          </Button>
          <Button 
            onClick={() => supabase.auth.signOut()} 
            variant="outline"
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'max-w-sm' : ''}>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#f97316', // FUZO orange
                brandAccent: '#ea580c',
              },
            },
          },
          className: {
            anchor: 'text-orange-600 hover:text-orange-700',
            button: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600',
            input: 'rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500',
          },
        }}
        providers={['google']}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
        onlyThirdPartyProviders
        showLinks={false}
        view="sign_in"
        theme="light"
      />
    </div>
  );
}