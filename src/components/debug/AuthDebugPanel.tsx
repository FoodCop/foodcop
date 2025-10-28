import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { AuthService } from '../../services/authService';
import type { AuthUser } from '../../types/auth';

export function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Check AuthService
        const authStatus = await AuthService.checkAuthStatus();
        const currentUser = await AuthService.getCurrentUser();
        
        setDebugInfo({
          timestamp: new Date().toISOString(),
          supabaseSession: session ? {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at
          } : null,
          sessionError,
          authServiceStatus: authStatus,
          currentUser: currentUser ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name
          } : null,
          urlHash: window.location.hash,
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };

    checkAuth();
    
    // Refresh every 5 seconds
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-xs z-50"
      >
        🐛 Debug Auth
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50 font-mono">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-2 text-xs text-gray-400">
        Auto-refreshes every 5s
      </div>
    </div>
  );
}