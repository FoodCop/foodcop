'use client';

import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PhotosTab() {
  return (
    <div className="text-center py-12">
      <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Your Food Photos</h3>
      <p className="text-gray-600 mb-4">
        Capture and share your culinary adventures.
      </p>
      <Button variant="outline">
        <Upload className="w-4 h-4 mr-2" />
        Upload Photo
      </Button>
    </div>
  );
}