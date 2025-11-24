import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Badge } from '../badge';
import { Button } from '../button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { 
  Clock, Users, Heart, ExternalLink, MapPin, Star, DollarSign, 
  Phone, Globe, Navigation, Calendar, Download, ZoomIn, ZoomOut, 
  RotateCw, Play, Pause, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import { GoogleMapView } from '../../maps/GoogleMapView';
import type { UnifiedContentData } from './types';

interface UnifiedContentRendererProps {
  data: UnifiedContentData;
  onAction?: (action: string, data: any) => void;
}

export const UnifiedContentRenderer: React.FC<UnifiedContentRendererProps> = ({ data, onAction }) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Render hero section (image/video/photo)
  const renderHero = () => {
    if (data.type === 'video' && data.media.youtubeId) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${data.media.youtubeId}?autoplay=1&rel=0`}
              title={data.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    if (data.type === 'video' && data.media.video) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <video
            src={data.media.video}
            poster={data.media.image}
            className="w-full h-auto max-h-[70vh]"
            controls
            autoPlay
          />
        </div>
      );
    }

    const imageUrl = data.media.image || (data.media.photos && data.media.photos[0]?.url);
    
    if (data.type === 'photo') {
      return (
        <div className="relative">
          <div className="relative overflow-hidden rounded-lg bg-gray-100">
            <img
              src={imageUrl}
              alt={data.title}
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
                target.style.display = 'none';
              }}
            />
          </div>
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
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl || '';
                link.download = data.title || 'photo.jpg';
                link.click();
              }}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    // Default hero for recipes, restaurants, etc.
    if (imageUrl) {
      return (
        <div className="relative">
          <img
            src={imageUrl}
            alt={data.title}
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white bg-black/50 p-3 rounded backdrop-blur-sm">
              {data.title}
            </h1>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">
            {data.type === 'recipe' ? '🍽️' : data.type === 'restaurant' ? '📍' : '📷'}
          </div>
          <p>No image available</p>
        </div>
      </div>
    );
  };

  // Render quick stats/info
  const renderQuickStats = () => {
    if (data.type === 'recipe') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.metadata.readyInMinutes && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{data.metadata.readyInMinutes} min</span>
            </div>
          )}
          {data.metadata.servings && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{data.metadata.servings} servings</span>
            </div>
          )}
          {data.metadata.healthScore && (
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-green-500" />
              <span>{data.metadata.healthScore}/100</span>
            </div>
          )}
          {data.metadata.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={data.metadata.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Source
              </a>
            </Button>
          )}
        </div>
      );
    }

    if (data.type === 'restaurant') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.metadata.rating && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold">{data.metadata.rating}</span>
            </div>
          )}
          {data.metadata.priceLevel && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span>{'💰'.repeat(data.metadata.priceLevel)}</span>
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={data.metadata.googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-4 h-4 mr-1" />
              Directions
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(data.title + ' ' + data.metadata.address)}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Search
            </a>
          </Button>
        </div>
      );
    }

    return null;
  };

  // Render main content based on type
  const renderContent = () => {
    if (data.type === 'recipe') {
      return (
        <div className="space-y-6">
          {data.metadata.diets && data.metadata.diets.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Dietary Information</h3>
              <div className="flex flex-wrap gap-2">
                {data.metadata.diets.map((diet, index) => (
                  <Badge key={index} variant="secondary" className="capitalize">
                    {diet.replace(/([A-Z])/g, ' $1').trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </CardContent>
            </Card>
          )}

          {data.metadata.ingredients && data.metadata.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.metadata.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-gray-500">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.metadata.instructions && data.metadata.instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {data.metadata.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {data.metadata.nutrition && (
            <Card>
              <CardHeader>
                <CardTitle>Nutrition (per serving)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.metadata.nutrition.calories && (
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-500">
                        {data.metadata.nutrition.calories}
                      </div>
                      <div className="text-sm text-gray-500">Calories</div>
                    </div>
                  )}
                  {data.metadata.nutrition.protein && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {data.metadata.nutrition.protein}
                      </div>
                      <div className="text-sm text-gray-500">Protein</div>
                    </div>
                  )}
                  {data.metadata.nutrition.carbs && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        {data.metadata.nutrition.carbs}
                      </div>
                      <div className="text-sm text-gray-500">Carbs</div>
                    </div>
                  )}
                  {data.metadata.nutrition.fat && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">
                        {data.metadata.nutrition.fat}
                      </div>
                      <div className="text-sm text-gray-500">Fat</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (data.type === 'restaurant') {
      return (
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="map">Location</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{data.metadata.address}</p>
                {data.metadata.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    {data.metadata.location.lat.toFixed(6)}, {data.metadata.location.lng.toFixed(6)}
                  </p>
                )}
              </CardContent>
            </Card>

            {(data.metadata.phoneNumber || data.metadata.website) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.metadata.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <a href={`tel:${data.metadata.phoneNumber}`} className="text-blue-600 hover:underline">
                        {data.metadata.phoneNumber}
                      </a>
                    </div>
                  )}
                  {data.metadata.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      <a 
                        href={data.metadata.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {data.metadata.openingHours && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Hours
                    {data.metadata.openingHours.open_now !== undefined && (
                      <Badge variant={data.metadata.openingHours.open_now ? "default" : "secondary"}>
                        {data.metadata.openingHours.open_now ? "Open Now" : "Closed"}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.metadata.openingHours.weekday_text ? (
                    <ul className="space-y-1">
                      {data.metadata.openingHours.weekday_text.map((day, index) => (
                        <li key={index} className="text-sm text-gray-700">{day}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Hours not available</p>
                  )}
                </CardContent>
              </Card>
            )}

            {data.metadata.types && data.metadata.types.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.types.map((type, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {data.metadata.location ? (
                  <div className="h-96 rounded-lg overflow-hidden">
                    <GoogleMapView
                      center={data.metadata.location}
                      zoom={15}
                      markers={[{
                        id: data.id,
                        position: data.metadata.location,
                        title: data.title,
                      }]}
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-1">Location not available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {data.media.photos && data.media.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.media.photos.map((photo, index) => (
                  <div 
                    key={index}
                    className="aspect-square cursor-pointer overflow-hidden rounded-lg group"
                    onClick={() => setActivePhoto(index)}
                  >
                    <img
                      src={photo.url}
                      alt={`${data.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.parentElement?.remove();
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-4xl mb-4">📸</div>
                  <p className="text-gray-500">No photos available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      );
    }

    if (data.type === 'photo') {
      return (
        <div className="space-y-6">
          {(data.title || data.description) && (
            <Card>
              <CardHeader>
                {data.title && (
                  <CardTitle className="text-xl">{data.title}</CardTitle>
                )}
              </CardHeader>
              {data.description && (
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{data.description}</p>
                </CardContent>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.metadata.restaurantName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{data.metadata.restaurantName}</p>
                </CardContent>
              </Card>
            )}

            {data.metadata.visitDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Visit Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {new Date(data.metadata.visitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </CardContent>
              </Card>
            )}

            {data.metadata.rating && (
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
                          star <= (data.metadata.rating || 0)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {data.metadata.rating}/5
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.metadata.tags && data.metadata.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.tags.map((tag, index) => (
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
      );
    }

    if (data.type === 'video') {
      return (
        <div className="space-y-6">
          {data.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.metadata.duration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{formatDuration(data.metadata.duration)}</span>
              </div>
            )}
            {data.metadata.viewCount && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{data.metadata.viewCount.toLocaleString()} views</span>
              </div>
            )}
            {data.metadata.channelName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{data.metadata.channelName}</span>
              </div>
            )}
            {data.metadata.uploadDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(data.metadata.uploadDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {data.metadata.tags && data.metadata.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return null;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {renderHero()}
      {renderQuickStats()}
      {renderContent()}
    </div>
  );
};

export default UnifiedContentRenderer;

