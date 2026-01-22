import type { ImageMetadata, SnapTag, SnapCard } from '../types/snap';
import type { User } from '@supabase/supabase-js';

export const snapCardFormatter = {
  /**
   * Convert raw image data + metadata + tags into a formatted SnapCard
   */
  async formatImageToCard(
    imageData: string,
    metadata: ImageMetadata,
    tags: SnapTag[],
    caption: string,
    user: User
  ): Promise<SnapCard> {
    // 1. Optimize image
    const optimizedImageUrl = await this.optimizeSnapImage(imageData);

    // 2. Generate unique ID
    const cardId = this.generateCardId();

    // 3. Calculate points
    const pointsEarned = tags.reduce((total, tag) => total + tag.pointValue, 0);

    // 4. Create card
    const card: SnapCard = {
      id: cardId,
      imageUrl: optimizedImageUrl,
      imageData, // Keep original as fallback
      caption,
      tags,
      pointsEarned,
      author: {
        userId: user.id,
        displayName: user.user_metadata?.full_name || user.email || 'Anonymous',
        avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
      },
      location:
        metadata.latitude && metadata.longitude
          ? {
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              address: metadata.fileName // Could be reverse geocoded later
            }
          : undefined,
      createdAt: new Date(),
      publishedTo: null
    };

    return card;
  },

  /**
   * Optimize image: resize, crop, compress
   */
  async optimizeSnapImage(
    base64: string,
    width: number = 600,
    height: number = 600,
    quality: number = 85
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Center-crop to maintain aspect ratio
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;

          let sx = 0,
            sy = 0,
            sw = img.width,
            sh = img.height;

          if (imgRatio > canvasRatio) {
            // Image is wider, crop width
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
          } else {
            // Image is taller, crop height
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

          // Convert to WebP for better compression
          // Fallback to PNG if WebP not supported
          try {
            const webpData = canvas.toDataURL('image/webp', quality / 100);
            // Check if WebP is supported (some browsers return PNG)
            if (webpData.startsWith('data:image/webp')) {
              resolve(webpData);
            } else {
              resolve(canvas.toDataURL('image/png'));
            }
          } catch {
            resolve(canvas.toDataURL('image/png'));
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64;
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Generate unique card ID
   */
  generateCardId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `snap-${timestamp}-${random}`;
  },

  /**
   * Validate image data URL
   */
  isValidImageData(data: string): boolean {
    return data.startsWith('data:image/');
  },

  /**
   * Get image dimensions from data URL
   */
  async getImageDimensions(data: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = data;
    });
  }
};
