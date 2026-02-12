import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraAlt, Close, Star, Upload, LocalPizza, RamenDining, SetMeal, Whatshot, RiceBowl, BakeryDining, Fastfood, Restaurant, Favorite, Place, Schedule } from '@mui/icons-material';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { useAuth } from '../auth/AuthProvider';
import { MinimalHeader } from '../common/MinimalHeader';
import { uploadImage } from './utils/snap-api';
import { supabase } from '../../services/supabase';

// Mock mode - set to true to bypass camera and use mock photo
const MOCK_CAMERA_MODE = false;

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  accuracy: number | null;
}

interface CapturedPhoto {
  imageData: string;
  metadata: PhotoMetadata;
}

const cuisineTypes = [
  { icon: LocalPizza, label: 'Italian' },
  { icon: RamenDining, label: 'Chinese' },
  { icon: SetMeal, label: 'Japanese' },
  { icon: Whatshot, label: 'Mexican' },
  { icon: Whatshot, label: 'Indian' },
  { icon: RiceBowl, label: 'Thai' },
  { icon: BakeryDining, label: 'French' },
  { icon: Fastfood, label: 'American' },
  { icon: Restaurant, label: 'Mediterranean' },
  { icon: RiceBowl, label: 'Korean' },
  { icon: RiceBowl, label: 'Vietnamese' },
  { icon: Whatshot, label: 'Spanish' },
  { icon: Restaurant, label: 'Greek' },
  { icon: Whatshot, label: 'Middle Eastern' },
  { icon: Restaurant, label: 'Other' }
];

export function Snap() {
  const { user } = useAuth();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form states
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      toast.error('Unable to access camera');
      console.error('Camera access error:', error);
    }
  }, [isMobile]);

  // Auto-start camera on mobile
  useEffect(() => {
    if (isMobile && !cameraStarted) {
      setCameraStarted(true);
      if (MOCK_CAMERA_MODE) {
        setShowCamera(true);
      } else {
        startCamera();
      }
    }
  }, [isMobile, cameraStarted, startCamera]);

  // Assign stream to video element when both are available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showCamera]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [stream]);

  const getGeolocation = (): Promise<PhotoMetadata> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported');
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
          toast.error('Unable to get location');
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

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready yet. Please wait a moment and try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    toast.info('Capturing location...');
    const metadata = await getGeolocation();

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    setCapturedPhoto({ imageData, metadata });
    setShowCamera(false);
    setShowTagging(true);
  };

  const handleDisclaimerContinue = () => {
    setShowDisclaimer(false);
    if (MOCK_CAMERA_MODE) {
      setShowCamera(true);
    } else {
      startCamera();
    }
  };

  const createMockPhoto = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue('--color-primary').trim();
      const secondaryColor = computedStyle.getPropertyValue('--color-secondary').trim();
      const accentColor = computedStyle.getPropertyValue('--color-accent').trim();
      const neutralText = computedStyle.getPropertyValue('--color-neutral-text').trim();
      
      gradient.addColorStop(0, primaryColor || '#ffe838');
      gradient.addColorStop(0.5, secondaryColor || '#e89f3c');
      gradient.addColorStop(1, accentColor || '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.fillStyle = neutralText || '#1f2937';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍕 Mock Food Photo', 400, 250);
      ctx.font = '24px sans-serif';
      ctx.fillText('This is a placeholder for testing', 400, 320);
    }
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    toast.info('Using mock location...');
    const metadata: PhotoMetadata = {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: new Date(),
      accuracy: 10
    };
    
    toast.success('Mock photo captured!');
    
    setCapturedPhoto({ imageData, metadata });
    setShowCamera(false);
    setShowTagging(true);
  };

  const handleCameraCapture = () => {
    if (MOCK_CAMERA_MODE) {
      createMockPhoto();
    } else {
      capturePhoto();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    // Convert File to data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      toast.info('Capturing location...');
      getGeolocation().then((metadata) => {
        setCapturedPhoto({ imageData, metadata });
        setShowCamera(false);
        setShowTagging(true);
      });
    };
    reader.readAsDataURL(file);
  };

  const openFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTaggingSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to save photos');
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

    if (!capturedPhoto) {
      toast.error('No photo data found!');
      return;
    }

    try {
      setSaving(true);
      
      // Step 1: Upload image to Supabase Storage
      console.log('📸 Uploading image...');
      const uploadResult = await uploadImage(capturedPhoto.imageData);
      
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
          setShowTagging(false);
          // Reset back to initial state on mobile
          if (isMobile) {
            setShowDisclaimer(true);
          }
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
    setCapturedPhoto(null);
  };

  const handleCancel = () => {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    setShowCamera(false);
    setShowTagging(false);
    resetForm();
    setShowDisclaimer(true);
  };

  const handleRatingClick = (value: number) => {
    setRating(value === rating ? 0 : value);
  };

  // Disclaimer Screen
  if (showDisclaimer) {
    return (
      <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen">
        {/* Content */}
        <div className="px-5 py-8">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] p-6 space-y-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                <CameraAlt className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">Welcome to SNAP!</h2>
              <p className="text-gray-600 text-sm">Share your food discoveries</p>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-gray-700">This is a family-friendly site focused solely on food photography.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-900 mb-2">✅ Please post:</p>
                <ul className="space-y-1 ml-4 text-green-800">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Food photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Restaurant frontages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Meal presentations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-900 mb-2">❌ Please avoid:</p>
                <ul className="space-y-1 ml-4 text-red-800">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Selfies or people photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Inappropriate content</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleDisclaimerContinue}
              className="w-full h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Continue to Camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera Screen
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {MOCK_CAMERA_MODE ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="text-center space-y-6 p-8">
                <CameraAlt sx={{ fontSize: 128, color: 'var(--color-accent)', opacity: 0.3 }} className="mx-auto" />
                <div className="space-y-2">
                  <h2 className="text-white text-xl font-semibold">Mock Camera Mode</h2>
                  <p className="text-white/60">Click capture button below</p>
                </div>
              </div>
              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {[...new Array(9)].map((_, i) => (
                  <div key={`grid-${i}`} className="border border-white/10" />
                ))}
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {/* Camera Controls */}
        <div className="bg-black/90 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={handleCancel}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <Close sx={{ fontSize: 24, color: 'var(--color-accent)' }} />
            </button>
            
            <button
              onClick={handleCameraCapture}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg"
            >
              <CameraAlt sx={{ fontSize: 32, color: 'var(--color-primary)' }} />
            </button>

            <button
              onClick={openFileUpload}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Upload from gallery"
            >
              <Upload sx={{ fontSize: 24, color: 'var(--color-accent)' }} />
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Tagging Screen
  if (showTagging) {
    // Success screen
    if (showSuccess) {
      return (
        <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen flex items-center justify-center">
          <div className="text-center px-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce">
              <Favorite sx={{ fontSize: 48, color: 'var(--color-accent)' }} />
            </div>
            <h2 className="font-[Poppins] font-bold text-2xl text-gray-900 mb-2">Saved! 🎉</h2>
            <p className="text-gray-600">Your food photo is now in your Plate</p>
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-full font-semibold">
              <span>+10 Points</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen">
        {/* Content */}
        <div className="px-5 py-6 space-y-6">
          {/* Photo Preview */}
          {capturedPhoto && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)]">
              <img 
                src={capturedPhoto.imageData} 
                alt="Captured" 
                className="w-full h-full object-cover"
              />
              {Boolean(capturedPhoto.metadata.latitude && capturedPhoto.metadata.longitude) && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  <Place sx={{ fontSize: 12 }} />
                  <span>Located</span>
                </div>
              )}
              {capturedPhoto.metadata.timestamp && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1 bg-black/50 text-white text-xs font-semibold rounded-full">
                  <Schedule sx={{ fontSize: 12 }} />
                  <span>{new Date(capturedPhoto.metadata.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <label htmlFor="restaurant-name" className="text-sm font-semibold text-gray-900">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <input
                id="restaurant-name"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Joe's Pizza"
                className="w-full h-12 px-4 bg-[var(--color-neutral-bg)] border-none rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Cuisine Type */}
            <div className="space-y-2">
              <label htmlFor="cuisine-type" className="text-sm font-semibold text-gray-900">
                Type of Cuisine <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {cuisineTypes.map((type) => (
                  <button
                    key={type.label}
                    onClick={() => setCuisine(type.label)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      cuisine === type.label
                        ? 'bg-[var(--color-primary)] text-gray-900 shadow-md'
                        : 'bg-[var(--color-neutral-bg)] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <type.icon sx={{ fontSize: 14 }} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label htmlFor="rating" className="text-sm font-semibold text-gray-900">Rating (Optional)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingClick(value)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        value <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-gray-900">Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                className="w-full px-4 py-3 bg-[var(--color-neutral-bg)] border-none rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
            </div>
          </div>

          {/* Auth Status */}
          {!user && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">
                ❌ Please sign in to save photos
              </p>
            </div>
          )}

          {user && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                ✅ Signed in as {user.email}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 h-12 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTaggingSubmit}
              disabled={saving || !user}
              className="flex-1 h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save to Plate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default State - Loading for mobile, start button for desktop
  return (
    <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen flex flex-col" style={{ fontSize: '10pt' }}>
      <MinimalHeader showLogo={true} logoPosition="left" />
      <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-8">
        {isMobile ? (
          <>
            <CameraAlt className="w-24 h-24 text-gray-400 mx-auto mb-6 animate-pulse" />
            <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">Starting Camera...</h2>
            <p className="text-gray-600 mb-6">Please allow camera access</p>
          </>
        ) : (
          <>
            <CameraAlt className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">Ready to SNAP?</h2>
            <p className="text-gray-600 mb-6">Capture and share your food moments</p>
            <button
              onClick={() => setShowDisclaimer(true)}
              className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Camera
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
