import { Button } from '../ui/button';
import { Card } from '../ui/card';

/**
 * Mobile Layouts Showcase - All mobile screen designs
 */
export function MobileLayoutsShowcase() {
  const mobileScreens = [
    {
      id: 'welcome',
      title: 'Welcome Screen',
      description: 'First screen users see',
      component: 'LandingPage',
      path: 'components/home/LandingPage'
    },
    {
      id: 'auth',
      title: 'Authentication',
      description: 'Sign in / Sign up screen',
      component: 'AuthPage',
      path: 'components/auth/AuthPage'
    },
    {
      id: 'onboarding-welcome',
      title: 'Onboarding: Welcome',
      description: 'Step 0 - Welcome message',
      component: 'OnboardingFlow (Step 0)',
      path: 'components/onboarding/OnboardingFlow'
    },
    {
      id: 'onboarding-phone',
      title: 'Onboarding: Phone',
      description: 'Step 1 - Phone number input',
      component: 'PhoneStep',
      path: 'components/onboarding/steps/PhoneStep'
    },
    {
      id: 'onboarding-location',
      title: 'Onboarding: Location',
      description: 'Step 2 - Location selection',
      component: 'LocationStep',
      path: 'components/onboarding/steps/LocationStep'
    },
    {
      id: 'onboarding-preferences',
      title: 'Onboarding: Preferences',
      description: 'Step 3 - Food preferences',
      component: 'PreferencesStep',
      path: 'components/onboarding/steps/PreferencesStep'
    },
    {
      id: 'feed',
      title: 'Feed (Social)',
      description: 'Social feed with posts',
      component: 'FeedApp',
      path: 'components/feed/App'
    },
    {
      id: 'scout',
      title: 'Scout (Restaurants)',
      description: 'Restaurant search and map',
      component: 'ScoutApp',
      path: 'components/scout/App'
    },
    {
      id: 'bites',
      title: 'Bites (Recipes)',
      description: 'Recipe browser',
      component: 'BitesApp',
      path: 'components/bites/App'
    },
    {
      id: 'trims',
      title: 'Trims (Videos)',
      description: 'Video browser (TikTok-style)',
      component: 'TrimsApp',
      path: 'components/trims/App'
    },
    {
      id: 'dash',
      title: 'Dash (Dashboard)',
      description: 'Analytics and insights',
      component: 'DashApp',
      path: 'components/dash/App'
    },
    {
      id: 'snap',
      title: 'Snap (Camera)',
      description: 'Photo capture',
      component: 'SnapApp',
      path: 'components/snap/App'
    },
    {
      id: 'plate',
      title: 'Plate (Profile & Saved)',
      description: 'User profile and saved items',
      component: 'PlateApp',
      path: 'components/plate/App'
    },
    {
      id: 'chat',
      title: 'Chat (Masterbot)',
      description: 'AI chatbot interface',
      component: 'ChatWithAuth',
      path: 'components/chat'
    },
    {
      id: 'mobile-nav',
      title: 'Mobile Navigation',
      description: 'Radial navigation menu',
      component: 'MobileRadialNav',
      path: 'components/navigation/MobileRadialNav'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Mobile viewport simulation */}
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.hash = '#/showcase'}
            className="mb-4"
          >
            ← Back to Showcase Hub
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📱 Mobile Layouts
          </h1>
          <p className="text-sm text-gray-600">
            All mobile screen designs and flows (375px width simulation)
          </p>
        </div>

        {/* Screen List */}
        <div className="space-y-4">
          {mobileScreens.map((screen, index) => (
            <Card key={screen.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {screen.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {screen.description}
                  </p>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-700 break-all">
                    <div className="text-gray-500 mb-1">Component:</div>
                    {screen.component}
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-700 mt-2 break-all">
                    <div className="text-gray-500 mb-1">Path:</div>
                    src/{screen.path}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile Design Notes */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">
            📝 Mobile Design Notes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Target width: 375px - 428px</li>
            <li>• Safe area support for notched devices</li>
            <li>• Bottom navigation (MobileRadialNav)</li>
            <li>• Touch-friendly tap targets (min 44px)</li>
            <li>• Vertical scrolling primary interaction</li>
          </ul>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.location.hash = '#/showcase'}
          >
            ← Hub
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.location.hash = '#/showcase/desktop'}
          >
            Desktop →
          </Button>
        </div>
      </div>
    </div>
  );
}
