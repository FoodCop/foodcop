import { FuzoButton } from './FuzoButton';

interface FuzoNavigationProps {
  onNavigateToSignup?: () => void;
}

export function FuzoNavigation({ onNavigateToSignup }: FuzoNavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="shrink-0">
              <h1 className="text-2xl font-bold text-[#F14C35]">FUZO</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <FuzoButton 
              variant="primary" 
              size="sm"
              onClick={onNavigateToSignup}
              className="transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Get Started Free
            </FuzoButton>
          </div>
        </div>
      </div>
    </nav>
  );
}