import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Badge } from '../../badge';
import { Button } from '../../button';
import {
  CalendarMonth,
  Place,
  Star,
  Download,
  ZoomIn,
  ZoomOut,
  RotateRight
} from '@mui/icons-material';
import type { PhotoViewerProps } from '../types';

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ data }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleDownload = async () => {
    try {
      const response = await fetch(data.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.title || 'photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Photo Display */}
      <div className="relative">
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={data.url}
            alt={data.title || 'Photo'}
            className={`w-full transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            style={{ 
              transform: `scale(${isZoomed ? 1.5 : 1}) rotate(${rotation}deg)`,
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
            onClick={() => setIsZoomed(!isZoomed)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png'; // Fallback image
            }}
          />
        </div>
                <RotateRight className="w-4 h-4" />
        {/* Image Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsZoomed(!isZoomed)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setRotation(prev => prev + 90)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <RotateRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Photo Information */}
      <div className="grid gap-4">
        {/* Title and Description */}
        {(data.title || data.description) && (
          <Card>
            <CardHeader>
              {data.title && (
                <CardTitle className="text-xl">{data.title}</CardTitle>
              )}
            </CardHeader>
            {data.description && (
              <CardContent>
                    <Star className="w-5 h-5 text-yellow-500" />
              </CardContent>
            )}
          </Card>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Restaurant Info */}
          {data.restaurantName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Place className="w-5 h-5 text-orange-500" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{data.restaurantName}</p>
              </CardContent>
            </Card>
          )}

          {/* Visit Date */}
          {data.visitDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarMonth className="w-5 h-5 text-blue-500" />
                  Visit Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {new Date(data.visitDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          {data.rating && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (data.rating || 0)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {data.rating}/5
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Empty state for minimal metadata */}
      {!data.title && !data.description && !data.restaurantName && !data.visitDate && !data.rating && (!data.tags || data.tags.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-gray-500 mb-2">Saved Photo</p>
            <p className="text-sm text-gray-400">
              No additional information available for this photo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 mt-1">💡</div>
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Photo Viewer Tips:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Click the photo to zoom in/out</li>
                <li>• Use the rotate button to adjust orientation</li>
                <li>• Download the photo using the download button</li>
                <li>• Press ESC to close the viewer</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoViewer;