import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button-simple';
import { cookieUtils } from '../../../utils/cookies';

// Define UserData type locally
interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}
// import { CheckCircle2 } from 'lucide-react'; // Removed - not available

interface SuccessScreenProps {
  userData: UserData;
}

export function SuccessScreen({ userData }: SuccessScreenProps) {
  const navigate = useNavigate();

  const handleGoToApp = () => {
    // Get and clear the stored return path from cookie
    let returnPath = cookieUtils.getAndClearReturnPath();

    // Clean up return path - remove any full URLs and keep only the path
    if (returnPath) {
      try {
        // If it's a full URL, extract just the pathname
        if (returnPath.startsWith('http://') || returnPath.startsWith('https://')) {
          const url = new URL(returnPath);
          returnPath = url.pathname;
        }
        // Remove hash if present
        if (returnPath.startsWith('#')) {
          returnPath = returnPath.slice(1);
        }
        // Ensure it starts with /
        if (!returnPath.startsWith('/')) {
          returnPath = `/${returnPath}`;
        }
      } catch (e) {
        // If URL parsing fails, treat as path
        console.warn('⚠️ Could not parse return path as URL, treating as path:', returnPath);
      }
    }

    console.log('🍪 SuccessScreen: Cookie return path check:', {
      returnPath,
      isValidReturn: returnPath && returnPath !== '/auth' && returnPath !== '#auth',
    });

    if (returnPath && returnPath !== '/auth' && returnPath !== '#auth' && returnPath.startsWith('/')) {
      console.log('✅ SuccessScreen: Redirecting to stored path:', returnPath);
      navigate(returnPath, { replace: true });
    } else {
      // Default to landing page - use React Router navigation
      console.log('🏠 SuccessScreen: No valid return path, going to landing');
      navigate('/landing', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <div className="text-6xl text-green-600">✅</div>
          </div>
        </div>

        <h1 className="mb-4">Welcome, {userData.name}!</h1>
        <p className="text-gray-600 mb-8">
          Your account has been successfully set up. You're all ready to go.
        </p>

        <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-lg">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Email</p>
            <p>{userData.email}</p>
          </div>

          {userData.phone && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Phone</p>
              <p>{userData.phone}</p>
            </div>
          )}

          {userData.location && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-sm">
                {userData.location.address || `${userData.location.lat.toFixed(4)}, ${userData.location.lng.toFixed(4)}`}
              </p>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleGoToApp}
        >
          Go to App
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          You can update these details later in settings
        </p>
      </div>
    </div>
  );
}
