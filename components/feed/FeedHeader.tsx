'use client';

import { Button } from '@/components/ui/button';
import { User, Settings, Home, Bug } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FeedHeaderProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export function FeedHeader({ onProfileClick, onSettingsClick }: FeedHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b">
      {/* Navigation Button */}
      <Link href="/">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full"
        >
          <Home className="h-5 w-5 text-muted-foreground" />
        </Button>
      </Link>

      {/* Logo */}
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
      </div>

      {/* Debug/Settings Button */}
      <Link href="/auth-debug">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full"
        >
          <Bug className="h-5 w-5 text-muted-foreground" />
        </Button>
      </Link>
    </div>
  );
}