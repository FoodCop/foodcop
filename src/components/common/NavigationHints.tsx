import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { X, Lightbulb, MapPin, Utensils, Video, Camera, Users } from 'lucide-react';
import { Button } from '../ui/button';

interface NavigationHint {
  id: string;
  route: string | string[];
  title: string;
  description: string;
  icon: React.ReactNode;
  dismissible?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const navigationHints: NavigationHint[] = [
  {
    id: 'feed-intro',
    route: '/feed',
    title: 'Discover Your Feed',
    description: 'Swipe through personalized food content. Like, save, or share items that catch your eye!',
    icon: <Utensils className="h-4 w-4" />,
    priority: 'high',
  },
  {
    id: 'scout-intro',
    route: '/scout',
    title: 'Find Restaurants',
    description: 'Search for restaurants near you. Filter by cuisine, distance, and more. Tap any restaurant for details!',
    icon: <MapPin className="h-4 w-4" />,
    priority: 'high',
  },
  {
    id: 'bites-intro',
    route: '/bites',
    title: 'Explore Recipes',
    description: 'Browse thousands of recipes. Filter by diet, meal type, or search for specific dishes. Save your favorites!',
    icon: <Utensils className="h-4 w-4" />,
    priority: 'medium',
  },
  {
    id: 'trims-intro',
    route: '/trims',
    title: 'Watch Cooking Videos',
    description: 'Discover quick cooking videos and tutorials. Save videos to your Plate for later!',
    icon: <Video className="h-4 w-4" />,
    priority: 'medium',
  },
  {
    id: 'plate-intro',
    route: '/plate',
    title: 'Your Personal Plate',
    description: 'All your saved recipes, restaurants, videos, and photos in one place. Build your food collection!',
    icon: <Camera className="h-4 w-4" />,
    priority: 'high',
  },
  {
    id: 'dash-intro',
    route: '/dash',
    title: 'Your Dashboard',
    description: 'Track your food journey, see your stats, and discover what your crew is up to!',
    icon: <Users className="h-4 w-4" />,
    priority: 'low',
  },
];

export function NavigationHints() {
  const location = useLocation();
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  // Load dismissed hints from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed-navigation-hints');
    if (stored) {
      try {
        setDismissedHints(new Set(JSON.parse(stored)));
      } catch (e) {
        console.warn('Failed to parse dismissed hints:', e);
      }
    }
  }, []);

  // Find relevant hint for current route
  const currentHint = navigationHints.find((hint) => {
    if (dismissedHints.has(hint.id)) return false;
    const routes = Array.isArray(hint.route) ? hint.route : [hint.route];
    return routes.some((route) => location.pathname.startsWith(route));
  });

  const handleDismiss = (hintId: string) => {
    const newDismissed = new Set(dismissedHints);
    newDismissed.add(hintId);
    setDismissedHints(newDismissed);
    localStorage.setItem('dismissed-navigation-hints', JSON.stringify(Array.from(newDismissed)));
  };

  if (!currentHint) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5 duration-300">
      <Alert className="bg-blue-50 border-blue-200 shadow-lg">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <AlertTitle className="text-blue-900 font-semibold flex items-center justify-between">
            <span>{currentHint.title}</span>
            {currentHint.dismissible !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                onClick={() => handleDismiss(currentHint.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </AlertTitle>
          <AlertDescription className="text-blue-800 mt-1">
            {currentHint.description}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

