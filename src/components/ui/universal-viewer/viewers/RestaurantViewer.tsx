import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Badge } from '../../badge';
import { 
  MapPin, 
  Star, 
  DollarSign, 
  Phone, 
  Globe, 
  ExternalLink,
  Clock,
  Navigation
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../tabs';
import type { RestaurantViewerProps } from '../types';

export const RestaurantViewer: React.FC<RestaurantViewerProps> = ({ data }) => {
  const [activePhoto, setActivePhoto] = useState(0);

  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return '💰'.repeat(level);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative">
        {data.photos.length > 0 ? (
          <div className="relative">
            <img
              src={data.photos[activePhoto]?.url}
              alt={data.name}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {data.photos.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {data.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhoto(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activePhoto ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p>No photos available</p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 right-20">
          <h1 className="text-2xl font-bold text-white bg-black/50 p-3 rounded backdrop-blur-sm">
            {data.name}
          </h1>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-semibold">{data.rating}</span>
          </div>
        )}
        
        {data.priceLevel && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span>{renderPriceLevel(data.priceLevel)}</span>
          </div>
        )}
        
        <Button variant="outline" size="sm" asChild>
          <a href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="w-4 h-4 mr-1" />
            Directions
          </a>
        </Button>

        <Button variant="outline" size="sm" asChild>
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(data.name + ' ' + data.address)}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Search
          </a>
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="map">Location</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{data.address}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
              </p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          {(data.phoneNumber || data.website) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <a href={`tel:${data.phoneNumber}`} className="text-blue-600 hover:underline">
                      {data.phoneNumber}
                    </a>
                  </div>
                )}
                {data.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    <a 
                      href={data.website} 
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

          {/* Opening Hours */}
          {data.openingHours && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hours
                  {data.openingHours.open_now !== undefined && (
                    <Badge variant={data.openingHours.open_now ? "default" : "secondary"}>
                      {data.openingHours.open_now ? "Open Now" : "Closed"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.openingHours.weekday_text ? (
                  <ul className="space-y-1">
                    {data.openingHours.weekday_text.map((day, index) => (
                      <li key={index} className="text-sm text-gray-700">{day}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Hours not available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Restaurant Types */}
          {data.types.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.types.map((type, index) => (
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
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-1">Interactive map coming soon</p>
                  <p className="text-sm text-gray-400 mb-3">
                    Lat: {data.location.lat}, Lng: {data.location.lng}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          {data.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.photos.map((photo, index) => (
                <div 
                  key={index}
                  className="aspect-square cursor-pointer overflow-hidden rounded-lg group"
                  onClick={() => setActivePhoto(index)}
                >
                  <img
                    src={photo.url}
                    alt={`${data.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      // Hide broken images
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
    </div>
  );
};

export default RestaurantViewer;