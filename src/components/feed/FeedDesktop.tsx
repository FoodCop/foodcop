/**
 * FeedDesktop Component
 * Desktop version of the Feed page
 * 
 * This component will be implemented based on UXpilot designs
 * and translated to our design system.
 */

import { useState, useEffect } from 'react';
import { FeedService } from '../../services/feedService';
import type { FeedCard } from './data/feed-content';

export function FeedDesktop() {
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
        pageSize: 20,
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
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
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Feed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFeed}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover</h1>
          <p className="text-gray-600">Find your next favorite meal</p>
        </div>

        {/* TODO: Implement desktop feed layout based on UXpilot designs */}
        <div className="grid grid-cols-1 gap-6">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No content available. Check back later!</p>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl shadow-md p-6">
                <p className="text-sm text-gray-500">Card Type: {card.type}</p>
                <p className="text-gray-700 mt-2">Card ID: {card.id}</p>
                {/* TODO: Render appropriate card component based on type */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

