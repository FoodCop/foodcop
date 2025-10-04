import React from 'react';
import Image from 'next/image';
import { SaveAndShare } from '@/components/SaveAndShare';
import { ShareToFriend } from '@/components/ShareToFriend';

export default function SocialFeaturesDemo() {
  const demoItems = [
    {
      id: 'demo-restaurant-1',
      type: 'restaurant' as const,
      title: 'The Italian Corner',
      imageUrl: '/images/placeholder-food.jpg'
    },
    {
      id: 'demo-recipe-1', 
      type: 'recipe' as const,
      title: 'Homemade Pizza Margherita',
      imageUrl: '/images/placeholder-food.jpg'
    },
    {
      id: 'demo-restaurant-2',
      type: 'restaurant' as const,
      title: 'Sushi Zen',
      imageUrl: '/images/placeholder-food.jpg'
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Social Features Demo</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Complete Social Workflow</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How to test the complete social system:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Visit <code>/friends</code> to send and accept friend requests</li>
            <li>Once you have friends, use the Save & Share buttons below</li>
            <li>Share items with your friends using the share icon</li>
            <li>Friends will receive notifications and can accept/reject shared items</li>
            <li>Accepted items are automatically saved to the friend&apos;s plate</li>
            <li>Use the &quot;View Plate&quot; button in friends list to see friend&apos;s saved items</li>
          </ol>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Demo Items - Save & Share with Friends</h2>
        
        {demoItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <span className="text-sm text-gray-500 capitalize">{item.type}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Combined Save & Share component */}
              <SaveAndShare
                itemId={item.id}
                itemType={item.type}
                title={item.title}
                imageUrl={item.imageUrl}
                size="md"
                showShareButton={true}
              />
              
              {/* Or individual Share component */}
              <ShareToFriend
                itemId={item.id}
                itemType={item.type}
                title={item.title}
                imageUrl={item.imageUrl}
                variant="button"
                size="md"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Available Social Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Friend Requests:</strong> Send, accept, reject friend requests</li>
          <li><strong>Real-time Notifications:</strong> Get notified of friend requests and shared items</li>
          <li><strong>Save to Plate:</strong> Save restaurants and recipes to your personal collection</li>
          <li><strong>Share with Friends:</strong> Share saved items with your approved friends</li>
          <li><strong>Friend Approval Workflow:</strong> Friends must approve shared items before they&apos;re saved</li>
          <li><strong>View Friend Plates:</strong> Browse your friends&apos; saved collections</li>
          <li><strong>Chat Integration:</strong> Chat with approved friends (placeholder)</li>
        </ul>
      </div>

      <div className="mt-4 text-center">
        <a 
          href="/friends" 
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Friends Page
        </a>
      </div>
    </div>
  );
}