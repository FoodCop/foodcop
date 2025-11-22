/**
 * FeedMobile Component
 * Mobile version of the Feed page
 * 
 * This component will be implemented based on UXpilot designs
 * and translated to our design system.
 */

import { useState, useEffect } from 'react';
import { FeedService } from '../../services/feedService';
import type { FeedCard } from './data/feed-content';

export function FeedMobile() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Get user location and preferences
      const result = await FeedService.generateFeed({
        pageSize: 10,
      });

      setCards(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Feed</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFeed}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-20">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Discover</h1>
          <p className="text-sm text-gray-600">Find your next favorite meal</p>
        </div>

        {/* TODO: Implement mobile feed layout based on UXpilot designs */}
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No content available. Check back later!</p>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs text-gray-500">Card Type: {card.type}</p>
                <p className="text-gray-700 mt-1 text-sm">Card ID: {card.id}</p>
                {/* TODO: Render appropriate card component based on type */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

