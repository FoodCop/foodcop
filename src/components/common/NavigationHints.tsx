import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toastHelpers } from '../../utils/toastHelpers';

interface NavigationHint {
  id: string;
  route: string | string[];
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

const navigationHints: NavigationHint[] = [
  {
    id: 'feed-intro',
    route: '/feed',
    title: 'Discover Your Feed',
    description: 'Swipe through personalized food content. Like, save, or share items that catch your eye!',
    priority: 'high',
  },
  {
    id: 'scout-intro',
    route: '/scout',
    title: 'Find Restaurants',
    description: 'Search for restaurants near you. Filter by cuisine, distance, and more. Tap any restaurant for details!',
    priority: 'high',
  },
  {
    id: 'bites-intro',
    route: '/bites',
    title: 'Explore Recipes',
    description: 'Browse thousands of recipes. Filter by diet, meal type, or search for specific dishes. Save your favorites!',
    priority: 'medium',
  },
  {
    id: 'trims-intro',
    route: '/trims',
    title: 'Watch Cooking Videos',
    description: 'Discover quick cooking videos and tutorials. Save videos to your Plate for later!',
    priority: 'medium',
  },
  {
    id: 'plate-intro',
    route: '/plate',
    title: 'Your Personal Plate',
    description: 'All your saved recipes, restaurants, videos, and photos in one place. Build your food collection!',
    priority: 'high',
  },
  {
    id: 'dash-intro',
    route: '/dash',
    title: 'Your Dashboard',
    description: 'Track your food journey, see your stats, and discover what your crew is up to!',
    priority: 'low',
  },
];

export function NavigationHints() {
  const location = useLocation();
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());

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

  // Find relevant hint for current route and show as toast
  useEffect(() => {
    const currentHint = navigationHints.find((hint) => {
      if (dismissedHints.has(hint.id)) return false;
      if (shownHints.has(hint.id)) return false; // Don't show again if already shown
      const routes = Array.isArray(hint.route) ? hint.route : [hint.route];
      return routes.some((route) => location.pathname.startsWith(route));
    });

    if (currentHint) {
      // Show hint as unified toast notification with same style as saved toasts
      toastHelpers.navigationHint(
        currentHint.description,
        {
          label: 'Continue',
          onClick: () => {
            // Mark as dismissed when user clicks Continue
            const newDismissed = new Set(dismissedHints);
            newDismissed.add(currentHint.id);
            setDismissedHints(newDismissed);
            localStorage.setItem('dismissed-navigation-hints', JSON.stringify(Array.from(newDismissed)));
          }
        },
        currentHint.title // Use the hint title (e.g., "Watch Cooking Videos")
      );
      
      // Mark as shown so it doesn't appear again on this page
      setShownHints(prev => new Set(prev).add(currentHint.id));
    }
  }, [location.pathname, dismissedHints, shownHints]);

  return null; // Component doesn't render anything, uses toast system instead
}

