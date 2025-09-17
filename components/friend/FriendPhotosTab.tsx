import React, { useState } from 'react';
import { Heart, MessageCircle, MapPin, Camera } from 'lucide-react';
import { UserPhoto } from '../constants/profileData';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FriendPhotosTabProps {
  photos: UserPhoto[];
}

export function FriendPhotosTab({ photos }: FriendPhotosTabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

  const handleLikePhoto = (photoId: string) => {
    const newLiked = new Set(likedPhotos);
    if (newLiked.has(photoId)) {
      newLiked.delete(photoId);
    } else {
      newLiked.add(photoId);
    }
    setLikedPhotos(newLiked);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-1">Food Journey</h2>
        <p className="text-sm text-gray-600">{photos.length} delicious moments shared</p>
      </div>

      {photos.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">No photos shared yet</h3>
          <p className="text-gray-600">This friend hasn't shared any food photos yet.</p>
        </div>
      ) : (
        /* Photos Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) => {
              const isLiked = likedPhotos.has(photo.id);
              const totalLikes = photo.likes + (isLiked ? 1 : 0);
              
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                >
                  <ImageWithFallback
                    src={photo.image}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <div className="bg-black/50 rounded-full px-2 py-1 flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">{totalLikes}</span>
                      </div>
                      <div className="bg-black/50 rounded-full px-2 py-1 flex items-center space-x-1">
                        <span className="text-white text-xs font-medium">+{photo.points}pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-black/50 text-white text-xs rounded-full font-medium backdrop-blur-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                      {photo.tags.length > 2 && (
                        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                          +{photo.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Photo Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">{photos.reduce((sum, photo) => sum + photo.likes, 0)}</p>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">{photos.reduce((sum, photo) => sum + photo.points, 0)}</p>
              <p className="text-sm text-gray-600">Points Earned</p>
            </div>
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">{photos.length}</p>
              <p className="text-sm text-gray-600">Photos Shared</p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Photo */}
            <div className="relative aspect-square">
              <ImageWithFallback
                src={selectedPhoto.image}
                alt={selectedPhoto.caption}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
              >
                ✕
              </button>
            </div>

            {/* Photo Details */}
            <div className="p-6 space-y-4">
              <div>
                <p className="font-medium text-[#0B1F3A] mb-2">{selectedPhoto.caption}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatDate(selectedPhoto.uploadedAt)}</span>
                  {selectedPhoto.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedPhoto.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedPhoto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-[#F8F9FA] text-sm font-medium text-gray-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions & Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikePhoto(selectedPhoto.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      likedPhotos.has(selectedPhoto.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPhotos.has(selectedPhoto.id) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {selectedPhoto.likes + (likedPhotos.has(selectedPhoto.id) ? 1 : 0)}
                    </span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-[#0B1F3A] transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Comment</span>
                  </button>
                </div>
                <div className="text-sm font-medium text-[#F14C35]">
                  +{selectedPhoto.points} points
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Prompt */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 border border-[#F14C35]/20">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📸</div>
          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-1">Show Some Love</h4>
            <p className="text-sm text-gray-600">Like their photos and get inspired for your own food adventures!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
