import type { SnapTag, PointsNotification } from '../types/snap';

/**
 * Point values for each tag category
 */
const TAG_POINT_VALUES = {
  cuisine: 10,
  dish: 10,
  restaurant: 5,
  ambiance: 5,
  custom: 5
} as const;

export const snapGameification = {
  /**
   * Calculate total points for an array of tags
   */
  calculatePoints(tags: SnapTag[]): number {
    return tags.reduce((total, tag) => total + tag.pointValue, 0);
  },

  /**
   * Get point value for a tag category
   */
  getPointsForCategory(category: SnapTag['category']): number {
    return TAG_POINT_VALUES[category] || 5;
  },

  /**
   * Create a tag with appropriate point value
   */
  createTag(
    label: string,
    category: SnapTag['category'],
    iconClass?: string
  ): SnapTag {
    return {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      label,
      category,
      pointValue: this.getPointsForCategory(category),
      iconClass
    };
  },

  /**
   * Create human-readable points notification
   */
  createPointsNotification(pointsEarned: number, tags: SnapTag[]): PointsNotification {
    const breakdown = tags
      .map(t => `${t.label} (+${t.pointValue})`)
      .join(', ');

    return {
      title: `🏆 +${pointsEarned} Points Earned!`,
      description: `Tags: ${breakdown}`,
      icon: 'award',
      pointValue: pointsEarned
    };
  },

  /**
   * Adjust point values based on content quality/engagement
   * (Future: AI moderation, duplicate detection)
   */
  adjustPointsBasedOnQuality(basePoints: number, qualityScore: number): number {
    // qualityScore: 0-100
    // Multiply points by quality factor (0.5x to 1.5x)
    const factor = 0.5 + qualityScore / 100;
    return Math.round(basePoints * factor);
  },

  /**
   * Get available point values
   */
  getAvailablePointValues(): number[] {
    return Array.from(new Set(Object.values(TAG_POINT_VALUES)));
  },

  /**
   * Validate tag
   */
  isValidTag(tag: SnapTag): boolean {
    return (
      tag.label.trim().length > 0 &&
      tag.pointValue > 0 &&
      ['cuisine', 'dish', 'restaurant', 'ambiance', 'custom'].includes(tag.category)
    );
  }
};
