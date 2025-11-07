import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Smartphone, Monitor, Palette } from 'lucide-react';

/**
 * UI Showcase Hub - Navigation to different showcase pages
 */
export function ShowcaseHub() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 FuzoFood UI Showcase
          </h1>
          <p className="text-lg text-gray-600">
            Complete visual reference for all layouts and components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mobile Layouts Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <a href="#/showcase/mobile" className="block text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Mobile Layouts</h2>
              <p className="text-gray-600 mb-4">
                All mobile screen designs and flows
              </p>
              <Button variant="outline" className="w-full">
                View Mobile Screens
              </Button>
            </a>
          </Card>

          {/* Desktop Layouts Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <a href="#/showcase/desktop" className="block text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Desktop Layouts</h2>
              <p className="text-gray-600 mb-4">
                All desktop screen designs and flows
              </p>
              <Button variant="outline" className="w-full">
                View Desktop Screens
              </Button>
            </a>
          </Card>

          {/* Components Library Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <a href="#/showcase/components" className="block text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">UI Components</h2>
              <p className="text-gray-600 mb-4">
                Buttons, dialogs, toasts, forms, and more
              </p>
              <Button variant="outline" className="w-full">
                View Components
              </Button>
            </a>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg border">
          <h3 className="font-semibold mb-4">Quick Access Links:</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/showcase/mobile'}>
              📱 Mobile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/showcase/desktop'}>
              🖥️ Desktop
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/showcase/components'}>
              🎨 Components
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/'}>
              🏠 Back to App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
