import { useAuth } from './AuthProvider';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function LoginButton() {
  const { user, loading, signOut } = useAuth();

  const handleSignIn = async () => {
    try {
      console.log('🔑 LoginButton: Starting Google OAuth sign-in...');
      
      // Store return path for after authentication
      const currentPath = window.location.hash || '#plate';
      localStorage.setItem('auth-return-path', currentPath);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/#auth'
        }
      });
      
      if (error) {
        console.error('❌ OAuth sign-in error:', error);
        return;
      }
      
      console.log('✅ OAuth sign-in initiated:', data);
    } catch (err) {
      console.error('❌ Sign-in error:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-600 opacity-75">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || "User"} />
            <AvatarFallback className="bg-orange-500 text-white text-xs">
              {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-700 font-medium">
            {user.user_metadata?.name || user.email}
          </span>
        </div>
        <Button onClick={signOut} variant="outline" size="sm" className="text-xs">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      className="bg-orange-600 hover:bg-orange-700 text-white"
    >
      Sign in with Google
    </Button>
  );
}