import { Button } from '../ui/button';
import { Card } from '../ui/card';

/**
 * Desktop Layouts Showcase - All desktop screen designs
 */
export function DesktopLayoutsShowcase() {
  const desktopScreens = [
    {
      id: 'landing',
      title: 'Landing Page',
      description: 'Desktop welcome/hero section',
      component: 'LandingPage',
      path: 'components/home/LandingPage',
      layout: 'Full width hero + sections'
    },
    {
      id: 'auth-desktop',
      title: 'Authentication',
      description: 'Desktop sign in/up',
      component: 'AuthPage',
      path: 'components/auth/AuthPage',
      layout: 'Centered card layout'
    },
    {
      id: 'feed-desktop',
      title: 'Feed (Desktop)',
      description: 'Social feed with sidebar',
      component: 'FeedApp',
      path: 'components/feed/App',
      layout: '3-column: Nav | Feed | Sidebar'
    },
    {
      id: 'scout-desktop',
      title: 'Scout (Desktop)',
      description: 'Restaurant search with map',
      component: 'ScoutApp',
      path: 'components/scout/App',
      layout: 'Split: List (left) | Map (right)'
    },
    {
      id: 'bites-desktop',
      title: 'Bites (Desktop)',
      description: 'Recipe grid layout',
      component: 'BitesApp',
      path: 'components/bites/App',
      layout: 'Header + Grid (3-4 columns)'
    },
    {
      id: 'trims-desktop',
      title: 'Trims (Desktop)',
      description: 'Video grid layout',
      component: 'TrimsApp',
      path: 'components/trims/App',
      layout: 'Grid layout with video cards'
    },
    {
      id: 'dash-desktop',
      title: 'Dash (Desktop)',
      description: 'Analytics dashboard',
      component: 'DashApp',
      path: 'components/dash/App',
      layout: 'Multi-widget dashboard'
    },
    {
      id: 'plate-desktop',
      title: 'Plate (Desktop)',
      description: 'Profile with tabs',
      component: 'PlateApp',
      path: 'components/plate/App',
      layout: 'Header + Tabbed content'
    },
    {
      id: 'chat-desktop',
      title: 'Chat (Desktop)',
      description: 'Chatbot interface',
      component: 'ChatWithAuth',
      path: 'components/chat',
      layout: 'Centered chat panel'
    },
    {
      id: 'universal-viewer',
      title: 'Universal Viewer',
      description: 'Modal for recipes/restaurants/videos',
      component: 'UniversalViewer',
      path: 'components/ui/universal-viewer',
      layout: 'Full-screen modal overlay'
    },
    {
      id: 'desktop-nav',
      title: 'Desktop Navigation',
      description: 'Top horizontal navigation',
      component: 'Navigation (in App.tsx)',
      path: 'App.tsx',
      layout: 'Fixed top bar'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.hash = '#/showcase'}
            className="mb-4"
          >
            ← Back to Showcase Hub
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🖥️ Desktop Layouts
          </h1>
          <p className="text-gray-600">
            All desktop screen designs and layouts (≥1024px width)
          </p>
        </div>

        {/* Screen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {desktopScreens.map((screen, index) => (
            <Card key={screen.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-green-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {screen.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {screen.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <div className="text-green-700 font-medium mb-1">Layout:</div>
                      <div className="text-green-900">{screen.layout}</div>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700">
                      <div className="text-gray-500 mb-1">Component:</div>
                      <div className="break-all">{screen.component}</div>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700">
                      <div className="text-gray-500 mb-1">Path:</div>
                      <div className="break-all">src/{screen.path}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Design Notes */}
        <Card className="mt-8 p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-green-900">
            📝 Desktop Design Notes
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Breakpoints:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• sm: ≥640px</li>
                <li>• md: ≥768px</li>
                <li>• lg: ≥1024px</li>
                <li>• xl: ≥1280px</li>
                <li>• 2xl: ≥1536px</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Common Patterns:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Top horizontal navigation bar</li>
                <li>• Sidebar layouts for sections</li>
                <li>• Multi-column grid layouts</li>
                <li>• Modal overlays for details</li>
                <li>• Hover states and tooltips</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => window.location.hash = '#/showcase/mobile'}
          >
            ← Mobile Layouts
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.hash = '#/showcase'}
          >
            Showcase Hub
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.hash = '#/showcase/components'}
          >
            Components →
          </Button>
        </div>
      </div>
    </div>
  );
}
