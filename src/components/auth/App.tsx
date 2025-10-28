import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SuccessScreen } from './components/SuccessScreen';

console.log('Auth App: Using shared Supabase client');

export interface UserData {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  preferences?: string[];
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userData, setUserData] = useState<UserData>({});

  useEffect(() => {
    console.log('Auth App mounted, checking session...');
    console.log('Current URL:', window.location.href);
    console.log('URL Hash:', window.location.hash);
    
    // Add persistent logging to localStorage
    const logEntry = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      hash: window.location.hash,
      type: 'AUTH_MOUNT'
    };
    
    const existingLogs = JSON.parse(localStorage.getItem('auth-debug-log') || '[]');
    existingLogs.push(logEntry);
    localStorage.setItem('auth-debug-log', JSON.stringify(existingLogs.slice(-10))); // Keep last 10 logs
    
    console.log('📊 Auth Debug History:', existingLogs);
    
    // Handle OAuth callback - Supabase processes URL fragments automatically
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Auth: Starting auth callback handling...');
        console.log('🔍 Auth: Current hash:', window.location.hash);
        
        // First, let Supabase process any OAuth tokens in the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('🔍 Auth: Initial session check:', { 
          session: session ? {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at
          } : null, 
          error: sessionError 
        });

        // Check for OAuth parameters in hash - handle both formats
        const hash = window.location.hash.substring(1);
        let hashParams;
        
        // Handle both "auth?access_token=..." and direct "access_token=..." formats
        if (hash.includes('?')) {
          const [, params] = hash.split('?', 2);
          hashParams = new URLSearchParams(params);
        } else {
          hashParams = new URLSearchParams(hash);
        }
        
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        console.log('🔍 Auth: Hash params check:', {
          originalHash: hash,
          accessToken: accessToken ? 'Present' : 'Missing',
          error,
          errorDescription,
          allParams: Object.fromEntries(hashParams.entries())
        });
        
        if (error) {
          console.error('❌ Auth: OAuth error:', error, errorDescription);
          setLoading(false);
          return;
        }

        // If we have OAuth tokens but no session yet, wait for session establishment
        if (accessToken && !session) {
          console.log('⏳ Auth: OAuth tokens found, waiting for session establishment...');
          setAuthProcessing(true);
          
          // Clean the OAuth parameters from the URL hash
          window.history.replaceState(null, '', window.location.pathname + '#auth');
          
          // Extract the refresh token for explicit session setting
          const refreshToken = hashParams.get('refresh_token');
          const expiresAt = hashParams.get('expires_at');
          
          console.log('🔑 Auth: Setting session with tokens:', {
            accessToken: 'present',
            refreshToken: refreshToken ? 'present' : 'missing',
            expiresAt: expiresAt
          });
          
          try {
            // Set the session explicitly using the OAuth tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('❌ Auth: Failed to set session:', error);
            } else if (data.session) {
              console.log('✅ Auth: Session established successfully');
              setSession(data.session);
              setUserData(prev => ({
                ...prev,
                userId: data.session?.user.id,
                email: data.session?.user.email
              }));
              
              // Clean the OAuth parameters from the URL hash after successful session
              window.history.replaceState(null, '', window.location.pathname + '#auth');
              
              setAuthProcessing(false);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('❌ Auth: Session establishment error:', err);
          }
          
          // Session setup complete
          setAuthProcessing(false);
          setLoading(false);
          return;
        }
        
        // If we already have a session, use it
        if (session) {
          console.log('✅ Auth: Using existing session');
          setSession(session);
          setUserData(prev => ({
            ...prev,
            userId: session.user.id,
            email: session.user.email
          }));
        }
        
        setAuthProcessing(false);
        setLoading(false);
      } catch (err) {
        console.error('Auth callback handling failed:', err);
        setAuthProcessing(false);
        setLoading(false);
      }
    };

    handleAuthCallback();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth: Auth state change detected:', { 
        event, 
        session: session ? {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at
        } : null 
      });
      setSession(session);
      if (session?.user) {
        console.log('✅ Auth: User authenticated via state change:', session.user.email);
        setUserData(prev => ({
          ...prev,
          userId: session.user.id,
          email: session.user.email
        }));
      } else {
        console.log('❌ Auth: No user in state change event');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(prev => ({ ...prev, ...data }));
    setOnboardingComplete(true);
    console.log('Complete user data collected:', { ...userData, ...data });
  };

  if (loading || authProcessing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {authProcessing ? 'Processing authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen supabase={supabase} />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        userData={userData}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return <SuccessScreen userData={userData} />;
}