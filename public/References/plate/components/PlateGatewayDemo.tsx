import { useState } from 'react';
import { createPlateGateway } from '../../../services/plateGateway';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { toast } from 'sonner';

interface PlateGatewayDemoProps {
  userId: string;
}

/**
 * Demo component showing how to use the PlateGateway
 * This component can be used to test saving data to Plate
 */
export function PlateGatewayDemo({ userId }: PlateGatewayDemoProps) {
  const [saving, setSaving] = useState(false);
  const gateway = createPlateGateway(userId);

  const handleSavePost = async () => {
    setSaving(true);
    try {
      const result = await gateway.savePost({
        content: 'Just discovered the most amazing ramen spot! The broth is incredible and the noodles are perfectly cooked. Highly recommend! 🍜',
        image: 'https://images.unsplash.com/photo-1697652973385-ccf1e85496b2?w=800',
        timestamp: new Date().toISOString(),
      });

      if (result.success) {
        toast.success('Post saved to your Plate!');
      } else {
        toast.error('Failed to save post: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRecipe = async () => {
    setSaving(true);
    try {
      const result = await gateway.saveRecipe({
        title: '15-Minute Garlic Shrimp Pasta',
        description: 'Quick and delicious pasta with garlic butter shrimp. Perfect for weeknight dinners!',
        image: 'https://images.unsplash.com/photo-1711539137930-3fa2ae6cec60?w=800',
        prepTime: '15 mins',
        difficulty: 'Easy',
      });

      if (result.success) {
        toast.success('Recipe saved to your Plate!');
      } else {
        toast.error('Failed to save recipe: ' + result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlace = async () => {
    setSaving(true);
    try {
      const result = await gateway.savePlace({
        name: 'The Golden Wok',
        address: '456 Chinatown Street, San Francisco, CA',
        cuisine: 'Chinese',
        rating: 4.7,
        priceRange: '$$',
      });

      if (result.success) {
        toast.success('Place saved to your Plate!');
      } else {
        toast.error('Failed to save place: ' + result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBatchSave = async () => {
    setSaving(true);
    try {
      const result = await gateway.batchSave({
        posts: [
          {
            content: 'Tried the new bubble tea spot - their brown sugar milk tea is life-changing! 🧋',
            timestamp: new Date().toISOString(),
          },
          {
            content: 'Sunday brunch at The Breakfast Club was amazing. The pancakes were fluffy perfection! 🥞',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ],
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
            caption: 'Neapolitan Pizza',
          },
        ],
        crew: [
          {
            name: 'Alex Morgan',
            username: 'alexm',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
            bio: 'Food photographer',
          },
        ],
      });

      if (result.success) {
        const { posts, photos, crew } = result.results;
        toast.success(`Batch saved: ${posts.length} posts, ${photos.length} photos, ${crew.length} crew!`);
      } else {
        toast.error('Failed to batch save: ' + result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Plate Gateway Demo</CardTitle>
        <p className="text-neutral-500">
          Click the buttons below to save demo data to your Plate. The Plate component will automatically update.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleSavePost} 
          disabled={saving}
          className="w-full"
        >
          Save Test Post
        </Button>
        
        <Button 
          onClick={handleSaveRecipe} 
          disabled={saving}
          className="w-full"
          variant="outline"
        >
          Save Test Recipe
        </Button>
        
        <Button 
          onClick={handleSavePlace} 
          disabled={saving}
          className="w-full"
          variant="outline"
        >
          Save Test Place
        </Button>
        
        <Button 
          onClick={handleBatchSave} 
          disabled={saving}
          className="w-full"
          variant="secondary"
        >
          Batch Save (Posts + Photos + Crew)
        </Button>

        <div className="mt-6 p-4 bg-neutral-100 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> After clicking any button, switch to the corresponding tab in Plate to see your saved content.
            The demo data will mix with existing content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
