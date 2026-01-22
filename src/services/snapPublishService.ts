import type { SnapCard } from '../types/snap';
import { createPlateGateway } from './plateGateway';
import { supabase } from './supabase';

export const snapPublishService = {
  /**
   * Publish to Plate (private user profile)
   */
  async publishToPlate(
    card: SnapCard,
    userId: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const plateGateway = createPlateGateway(userId);

      const result = await plateGateway.savePost({
        content: card.caption,
        image: card.imageUrl,
        metadata: {
          snapCardId: card.id,
          pointsEarned: card.pointsEarned,
          tags: card.tags.map(t => t.label),
          location: card.location,
          type: 'snap',
          source: 'snap_feature'
        }
      });

      return {
        success: result.success,
        postId: result.post?.id,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Plate'
      };
    }
  },

  /**
   * Publish to Feed (public, shareable)
   */
  async publishToFeed(
    card: SnapCard,
    userId: string
  ): Promise<{ success: boolean; feedCardId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('feed_posts')
        .insert({
          id: card.id,
          user_id: userId,
          image_url: card.imageUrl,
          caption: card.caption,
          tags: card.tags.map(t => t.label),
          points_earned: card.pointsEarned,
          location: card.location
            ? JSON.stringify({
                latitude: card.location.latitude,
                longitude: card.location.longitude
              })
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Award points to user
      await this.awardPointsToUser(userId, card.pointsEarned);

      return {
        success: true,
        feedCardId: data?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Feed'
      };
    }
  },

  /**
   * Award points to user's profile
   */
  async awardPointsToUser(userId: string, points: number): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('snap_points')
        .eq('id', userId)
        .single();

      const currentPoints = user?.snap_points || 0;

      await supabase
        .from('users')
        .update({ snap_points: currentPoints + points })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to award points:', error);
      // Don't throw - publishing should succeed even if points fail
    }
  }
};
