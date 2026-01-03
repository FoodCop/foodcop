/**
 * Ad Type Definitions for Bites Feed
 */

export interface AdItem {
  type: 'ad';
  id: string;
  imageUrl: string;
  format: 'square' | 'vertical';
  aspectRatio: '1:1' | '2:3' | '3:4';
  link?: string;
  altText: string;
  sponsor?: string;
}

export type AdFormat = AdItem['format'];
export type AdAspectRatio = AdItem['aspectRatio'];
