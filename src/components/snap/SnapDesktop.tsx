import { useState, useRef } from 'react';
import { Upload, Close, Star } from '@mui/icons-material';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { useAuth } from '../auth/AuthProvider';
import { uploadImage } from './utils/snap-api';
import { supabase } from '../../services/supabase';

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  accuracy: number | null;
}

interface CapturedPhoto {
  imageData: string;
  metadata: PhotoMetadata;
  fileName?: string;
}

/**
 * Desktop SNAP Component
 * Allows users to upload images from their computer with restaurant metadata
 * Optimized for desktop experience with upload instead of camera
 */
export function SnapDesktop() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<CapturedPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form states
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const cuisineTypes = [
    'Italian',
    'Chinese',
    'Japanese',
    'Mexican',
    'Indian',
    'Thai',
    'French',
    'American',
    'Mediterranean',
    'Korean',
    'Vietnamese',
    'Spanish',
    'Greek',
    'Middle Eastern',
    'Other'
  ];

  const getGeolocation = (): Promise<PhotoMetadata> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: null,
          longitude: null,
          timestamp: new Date(),
          accuracy: null
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
            accuracy: position.coords.accuracy
          });
          toast.success('Location captured!');
        },
        (_error) => {
          resolve({
            latitude: null,
            longitude: null,
            timestamp: new Date(),
            accuracy: null
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    // Convert File to data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      toast.info('Capturing location...');
      const metadata = await getGeolocation();
      setUploadedPhoto({
        imageData,
        metadata,
        fileName: file.name
      });
      setShowForm(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to save snaps');
      return;
    }

    if (!restaurantName.trim()) {
      toast.error('Restaurant name is required!');
      return;
    }

    if (!cuisine) {
      toast.error('Type of cuisine is required!');
      return;
    }

    if (!uploadedPhoto) {
      toast.error('No image selected!');
      return;
    }

    try {
      setSaving(true);

      // Step 1: Upload image to Supabase Storage
      console.log('📸 Uploading image...');
      const uploadResult = await uploadImage(uploadedPhoto.imageData);

      if (!uploadResult.success || !uploadResult.imageUrl) {
        toast.error(uploadResult.error || 'Failed to upload image');
        return;
      }

      console.log('✅ Image uploaded:', uploadResult.imageUrl);

      // Step 2: Save to posts table
      const contentParts = [`${restaurantName} - ${cuisine}`];
      if (description) contentParts.push(description);
      if (rating > 0) contentParts.push(`Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`);

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: contentParts.join('\n'),
          image_url: uploadResult.imageUrl,
          created_at: new Date().toISOString(),
        });

      if (!postError) {
        setShowSuccess(true);
        toastHelpers.saved('Snap');

        setTimeout(() => {
          resetForm();
          setShowSuccess(false);
          setShowForm(false);
        }, 2000);
      } else {
        toast.error(postError.message || 'Failed to save snap');
      }
    } catch (error) {
      console.error('❌ Error submitting snap:', error);
      toast.error('Failed to save snap');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setRestaurantName('');
    setCuisine('');
    setRating(0);
    setDescription('');
    setUploadedPhoto(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleRatingClick = (value: number) => {
    setRating(value === rating ? 0 : value);
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce">
              <span className="text-4xl">❤️</span>
            </div>
            <div>
              <h2 className="font-[Poppins] font-bold text-2xl text-gray-900 mb-2">Snap Saved! 🎉</h2>
              <p className="text-gray-600">Your delicious photo has been added to your Plate</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form Screen
  if (showForm && uploadedPhoto) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-8 py-6 flex items-center justify-between">
              <h1 className="font-[Poppins] font-bold text-xl text-white">Tag Your Snap</h1>
              <button
                onClick={handleCancel}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <Close sx={{ fontSize: 20, color: 'white' }} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Image Preview */}
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={uploadedPhoto.imageData}
                  alt="Snap preview"
                  className="w-full h-64 object-cover"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Enter restaurant name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>

                {/* Cuisine Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type of Cuisine *
                  </label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
                  >
                    <option value="">Select cuisine type</option>
                    {cuisineTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How was it?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleRatingClick(value)}
                        className={`flex-1 py-3 rounded-lg transition-all ${
                          rating >= value
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        <Star sx={{ fontSize: 20, margin: '0 auto' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    What did you eat? (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you had, flavors, recommendations..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Location Status */}
              {uploadedPhoto.metadata.latitude && uploadedPhoto.metadata.longitude && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    📍 Location captured at {uploadedPhoto.metadata.latitude.toFixed(4)}, {uploadedPhoto.metadata.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 h-12 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !user}
                  className="flex-1 h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save to Plate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Upload Screen
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-8 py-6">
            <h1 className="font-[Poppins] font-bold text-2xl text-white">SNAP - Upload Your Plate</h1>
          </div>

          <div className="p-12 space-y-8">
            {/* Main Upload Area */}
            <div
              ref={dragRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-3xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-[var(--color-primary)] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload
                sx={{
                  fontSize: 64,
                  color: dragActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                  marginBottom: 2
                }}
                className="mx-auto"
              />
              <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">
                Drop your photo here
              </h2>
              <p className="text-gray-600 mb-4">or click to browse your computer</p>
              <p className="text-sm text-gray-500">Max 10MB • JPG, PNG, GIF</p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Choose Image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Info Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-900 mb-2">✅ Good content:</p>
                <ul className="space-y-1 ml-4 text-green-800 text-sm">
                  <li>• Food and drinks</li>
                  <li>• Restaurant ambiance</li>
                  <li>• Meal presentations</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-900 mb-2">❌ Please avoid:</p>
                <ul className="space-y-1 ml-4 text-red-800 text-sm">
                  <li>• Selfies or people photos</li>
                  <li>• Inappropriate content</li>
                  <li>• Screenshots or memes</li>
                </ul>
              </div>
            </div>

            {/* Sign In Prompt */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-blue-900">
                  💡 Sign in to your account to save and share snaps
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
