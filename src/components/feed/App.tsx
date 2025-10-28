import { TinderSwipe } from './components/feed';
import { createMixedFeed } from './data/feed-content';

export default function App() {
  const feedCards = createMixedFeed(3); // Create 3 cycles = 21 cards total
  
  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down', cardId: string) => {
    console.log(`Swiped ${direction} on card ${cardId}`);
    
    // Handle different swipe directions
    if (direction === 'up') {
      console.log('SHARE card:', cardId);
      // Here you would typically:
      // - Open share dialog
      // - Share to social media
      // - Generate shareable link
    } else if (direction === 'down') {
      console.log('SAVE card to PLATE:', cardId);
      // Here you would typically:
      // - Save to appropriate PLATE category (Places/Posts/Recipes/Videos/Ads)
      // - Add to user's saved collection
      // - Store in local storage or backend
    } else if (direction === 'right') {
      console.log('LIKE card:', cardId);
      // Here you would typically:
      // - Send the swipe action to your backend
      // - Update user's preferences
      // - Show match animation if applicable
    } else if (direction === 'left') {
      console.log('PASS card:', cardId);
      // Here you would typically:
      // - Record the pass
      // - Update recommendation algorithm
    }
  };

  const handleNoMoreCards = () => {
    console.log('No more cards available');
    // Here you would typically:
    // - Fetch more cards from your backend
    // - Show a message to the user
    // - Suggest expanding search radius
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <TinderSwipe
        cards={feedCards}
        onSwipe={handleSwipe}
        onNoMoreCards={handleNoMoreCards}
      />
    </div>
  );
}