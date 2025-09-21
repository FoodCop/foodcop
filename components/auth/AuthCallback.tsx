import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getSupabaseClient } from "@utils/supabase";
import {
  cleanupOAuthCallback,
  getPostAuthDestination,
} from "../../utils/authRedirect";

interface AuthCallbackProps {
  onAuthComplete: (destination: string) => void;
  onAuthError: (error: string) => void;
}

export function AuthCallback({
  onAuthComplete,
  onAuthError,
}: AuthCallbackProps) {
  const { user, loading } = useAuth();
  const supabase = getSupabaseClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        if (!supabase) {
          setError("Authentication service not available");
          onAuthError("Supabase client unavailable");
          return;
        }

        // Wait for auth state to be determined
        if (loading) {
          return;
        }

        // Check for OAuth errors in URL first
        const url = new URL(window.location.href);
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        if (error) {
          const errorMessage = errorDescription || error;
          setError(`OAuth Error: ${errorMessage}`);
          onAuthError(errorMessage);
          return;
        }

        // If we have a user, auth was successful
        if (user) {
          // Clear any previous error state
          setError(null);

          // Clean up the URL
          cleanupOAuthCallback();

          // Determine where to redirect
          const destination = getPostAuthDestination();

          // Small delay to ensure URL cleanup is visible
          setTimeout(() => {
            onAuthComplete(destination);
          }, 100);
          return;
        }

        // If no user and we haven't checked session directly yet, do so
        if (!hasCheckedSession) {
          setHasCheckedSession(true);

          try {
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
              console.error("Session check error:", sessionError);
              setError("Authentication failed - session error");
              onAuthError("Session error");
              return;
            }

            if (session?.user) {
              // Session exists but user state hasn't updated yet
              // Clear error and wait for user state to update
              setError(null);
              return;
            }
          } catch (sessionErr) {
            console.error("Failed to check session:", sessionErr);
          }
        }

        // If we've checked session and still no user, this is a real failure
        if (hasCheckedSession && !user) {
          setError("Authentication failed - no user session found");
          onAuthError("No user session found");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        onAuthError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [user, loading, supabase, hasCheckedSession, onAuthComplete, onAuthError]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F14C35] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing sign in...
          </h2>
          <p className="text-gray-600">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Sign in failed
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E03D2A] transition-colors"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
