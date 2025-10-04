'use client';

import React from 'react';
import { SaveToPlate } from '@/components/SaveToPlate';
import { ShareToFriend } from '@/components/ShareToFriend';

interface SaveAndShareProps {
  itemId: string;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'other';
  title?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showShareButton?: boolean;
  className?: string;
  onSaved?: () => void;
  onUnsaved?: () => void;
}

export function SaveAndShare({
  itemId,
  itemType,
  title,
  imageUrl,
  size = 'md',
  showShareButton = true,
  className = '',
  onSaved,
  onUnsaved
}: SaveAndShareProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <SaveToPlate
        itemId={itemId}
        itemType={itemType}
        title={title}
        imageUrl={imageUrl}
        size={size}
        onSaved={onSaved}
        onUnsaved={onUnsaved}
      />
      
      {showShareButton && (
        <ShareToFriend
          itemId={itemId}
          itemType={itemType === 'photo' || itemType === 'other' ? 'recipe' : itemType}
          title={title || 'Shared Item'}
          imageUrl={imageUrl}
          variant="icon"
          size={size}
        />
      )}
    </div>
  );
}