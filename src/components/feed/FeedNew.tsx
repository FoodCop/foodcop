import { RefreshCw } from 'lucide-react';

export function FeedNew() {
  // Temporary maintenance mode - deactivated to prevent database egress
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feed Temporarily Unavailable</h2>
        <p className="text-gray-600 mb-4">
          We're performing maintenance to optimize your experience.
        </p>
        <p className="text-sm text-gray-500">
          Check back after December 1st for an improved feed!
        </p>
      </div>
    </div>
  );
}
