import { Camera, Heart, MapPin, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { UserPhoto } from "../constants/profileData";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  platesService,
  PlatePhoto as SavedPhoto,
} from "../services/platesService";

interface PhotosTabProps {
  photos: UserPhoto[];
}

export function PhotosTab({ photos }: PhotosTabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<SavedPhoto | null>(null);
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSavedPhotos();
    }
  }, [user]);

  const loadSavedPhotos = async () => {
    try {
      setLoading(true);
      const photos = await platesService.getSavedPhotos();
      setSavedPhotos(photos);
    } catch (error) {
      console.error("Failed to load saved photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    // For now, we'll add a sample photo - this would be replaced with actual upload functionality
    try {
      setUploading(true);
      const samplePhoto = {
        image: `https://images.unsplash.com/photo-${
          (Date.now() % 1000000) + 1500000000000
        }-${Math.random().toString(36).substr(2, 9)}?w=400&h=400&fit=crop`,
        caption: `Delicious food photo uploaded at ${new Date().toLocaleTimeString()}`,
        tags: ["delicious", "foodie", "yummy"],
        points: Math.floor(Math.random() * 20) + 5,
        location: "My Kitchen",
      };

      const result = await platesService.savePhoto(samplePhoto);
      if (result.success && result.savedPhoto) {
        setSavedPhotos((prev) => [result.savedPhoto!, ...prev]);
        console.log("✅ Photo added successfully");
      }
    } catch (error) {
      console.error("Failed to add photo:", error);
    } finally {
      setUploading(false);
    }
  };

  // Use saved photos from backend, fallback to props for compatibility
  const displayPhotos =
    savedPhotos.length > 0
      ? savedPhotos
      : photos.map((p) => ({
          ...p,
          id: p.id,
          image: p.image,
          caption: p.caption,
          tags: p.tags,
          points: p.points,
          likes: p.likes,
          uploadedAt: p.uploadedAt,
          location: p.location,
        }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1F3A]">Food Photos</h2>
          <p className="text-sm text-gray-600">
            {loading
              ? "Loading..."
              : `${displayPhotos.length} delicious moments`}
          </p>
        </div>
        <button
          onClick={handleAddPhoto}
          disabled={uploading}
          className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Photo</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        /* Loading State */
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : displayPhotos.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            Share Your Food Journey
          </h3>
          <p className="text-gray-600 mb-6">
            Upload photos of your meals and earn points while inspiring others.
          </p>
          <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2 mx-auto">
            <Camera className="w-4 h-4" />
            <span>Take a Photo</span>
          </button>
        </div>
      ) : (
        /* Photos Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {displayPhotos.map((photo) => (
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
                      <span className="text-white text-xs font-medium">
                        {photo.likes}
                      </span>
                    </div>
                    <div className="bg-black/50 rounded-full px-2 py-1 flex items-center space-x-1">
                      <span className="text-white text-xs font-medium">
                        +{photo.points}pts
                      </span>
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
            ))}
          </div>

          {/* Photo Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">
                {displayPhotos.reduce((sum, photo) => sum + photo.likes, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">
                {displayPhotos.reduce((sum, photo) => sum + photo.points, 0)}
              </p>
              <p className="text-sm text-gray-600">Points Earned</p>
            </div>
            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <p className="text-2xl font-bold text-[#F14C35]">
                {displayPhotos.length}
              </p>
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
                <p className="font-medium text-[#0B1F3A] mb-2">
                  {selectedPhoto.caption}
                </p>
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

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">
                      {selectedPhoto.likes}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">3</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-[#F14C35]">
                  +{selectedPhoto.points} points
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
