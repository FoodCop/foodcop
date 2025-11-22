import { RefreshCw } from 'lucide-react';

/**
 * FeedNew Component
 * Currently deactivated - will be redesigned with new feed service
 * FeedDesktop and FeedMobile components are ready for implementation
 */
export function FeedNew() {
  // Feed is deactivated until redesign is complete
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feed Under Redesign</h2>
        <p className="text-gray-600 mb-4">
          We're redesigning the feed experience for you.
        </p>
        <p className="text-sm text-gray-500">
          Check back soon for an improved feed!
        </p>
      </div>
    </div>
  );
}
