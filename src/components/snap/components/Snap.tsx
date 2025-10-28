import { useState, useRef, useEffect } from 'react';
import { Camera, X, Star, Trophy, Award, Medal } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../../auth/AuthProvider';
import { SavedItemsService } from '../../../services/savedItemsService';

// Mock mode - set to true to bypass camera and use mock photo
const MOCK_CAMERA_MODE = true;

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  accuracy: number | null;
}

interface RestaurantData {
  name: string;
  cuisine: string;
  rating: number;
  description: string;
}

interface CapturedPhoto {
  imageData: string;
  metadata: PhotoMetadata;
}

const cuisineTypes = [
  'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 
  'Thai', 'French', 'American', 'Mediterranean', 'Korean',
  'Vietnamese', 'Spanish', 'Greek', 'Middle Eastern', 'Other'
];

const gamificationMessages = [
  { icon: Trophy, message: "Restaurant Explorer!", color: "text-yellow-500" },
  { icon: Award, message: "Food Critic!", color: "text-purple-500" },
  { icon: Medal, message: "Taste Master!", color: "text-blue-500" },
  { icon: Star, message: "Culinary Detective!", color: "text-green-500" }
];

export function Snap() {
  const { user } = useAuth();  // Add authentication
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [saving, setSaving] = useState(false);  // Add saving state
  
  // Form states
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [gamificationReward, setGamificationReward] = useState<typeof gamificationMessages[0] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getGeolocation = (): Promise<PhotoMetadata> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
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
          toast.success('Location captured successfully!');
        },
        (error) => {
          toast.error('Unable to get location. Photo will be saved without location data.');
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

  const startCamera = async () => {
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
      toast.error('Unable to access camera. Please grant camera permissions.');
      console.error('Camera access error:', error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // Get geolocation
    toast.info('Capturing location data...');
    const metadata = await getGeolocation();

    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setCapturedPhoto({ imageData, metadata });
    setShowCamera(false);
    setShowTagging(true);
  };

  const handleDisclaimerContinue = () => {
    setShowDisclaimer(false);
    if (MOCK_CAMERA_MODE) {
      // Show mock camera screen
      setShowCamera(true);
    } else {
      startCamera();
    }
  };

  const useMockPhoto = async () => {
    // Create a mock photo with a colored placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.5, '#FFE66D');
      gradient.addColorStop(1, '#4ECDC4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
      
      // Add text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍕 Mock Food Photo', 400, 250);
      ctx.font = '24px sans-serif';
      ctx.fillText('This is a placeholder for testing', 400, 320);
      ctx.fillText('Tagging flow', 400, 360);
    }
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Get mock geolocation (San Francisco coordinates)
    toast.info('Using mock location data...');
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
      useMockPhoto();
    } else {
      capturePhoto();
    }
  };

  const handleTaggingSubmit = async () => {
    // Check authentication first
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
      
      // Create photo metadata for saved_items
      const photoMetadata = {
        restaurant_name: restaurantName,
        cuisine_type: cuisine,
        rating: rating,
        description: description,
        image_data: capturedPhoto.imageData,  // Base64 image data
        latitude: capturedPhoto.metadata.latitude,
        longitude: capturedPhoto.metadata.longitude,
        timestamp: capturedPhoto.metadata.timestamp.toISOString(),
        accuracy: capturedPhoto.metadata.accuracy,
        content_type: 'photo'
      };

      // Save to plate using savedItemsService
      const savedItemsService = new SavedItemsService();
      const result = await savedItemsService.saveItem({
        itemId: `photo-${Date.now()}`,  // Generate unique ID
        itemType: 'photo',
        metadata: photoMetadata
      });

      if (result.success) {
        // Show gamification reward
        const reward = gamificationMessages[Math.floor(Math.random() * gamificationMessages.length)];
        setGamificationReward(reward);

        toast.success('Photo saved to your Plate! 📸');
        
        // Reset after showing reward
        setTimeout(() => {
          resetForm();
          setGamificationReward(null);
          setShowTagging(false);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to save photo');
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
      toast.error('Failed to save photo. Please try again.');
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
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setShowTagging(false);
    resetForm();
    setShowDisclaimer(true);
  };

  const handleRatingClick = (value: number) => {
    setRating(value === rating ? 0 : value);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Welcome to SNAP! 📸</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-3 text-sm">
            <p className="text-muted-foreground">This is a family-friendly site focused solely on food photography.</p>
            <div>
              <p className="text-foreground mb-2">Please be respectful and post only:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Food photos</li>
                <li>Restaurant frontages</li>
              </ul>
            </div>
            <p className="text-muted-foreground">Please avoid selfies and egregious or lewd photos.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleDisclaimerContinue} className="w-full">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera View */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {MOCK_CAMERA_MODE ? (
              // Mock camera viewfinder
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center space-y-6 p-8">
                  <Camera className="h-32 w-32 text-white/30 mx-auto" />
                  <div className="space-y-2">
                    <h2 className="text-white/90">Mock Camera Mode</h2>
                    <p className="text-white/60">Click the camera button below to capture</p>
                  </div>
                  {/* Camera grid overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-b border-white/10"></div>
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-b border-white/10"></div>
                      <div className="border-r border-white/10"></div>
                      <div className="border-r border-white/10"></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Real camera video feed
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="bg-black/80 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={handleCameraCapture}
                size="icon"
                className="h-16 w-16 rounded-full bg-white hover:bg-gray-200"
              >
                <Camera className="h-8 w-8 text-black" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tagging Modal */}
      <Dialog open={showTagging} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tag Your Photo</DialogTitle>
            <DialogDescription>
              Add details about the restaurant and food
            </DialogDescription>
          </DialogHeader>

          {gamificationReward ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <gamificationReward.icon className={`h-24 w-24 ${gamificationReward.color}`} />
              <h3 className={gamificationReward.color}>{gamificationReward.message}</h3>
              <Badge variant="secondary" className="px-4 py-2">
                +10 Points
              </Badge>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Photo Preview */}
              {capturedPhoto && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <img 
                    src={capturedPhoto.imageData} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                  {capturedPhoto.metadata.latitude && capturedPhoto.metadata.longitude && (
                    <Badge className="absolute top-2 right-2 bg-green-600">
                      Location Captured
                    </Badge>
                  )}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">
                    Restaurant Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="restaurant-name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisine">
                    Type of Cuisine <span className="text-destructive">*</span>
                  </Label>
                  <Select value={cuisine} onValueChange={setCuisine}>
                    <SelectTrigger id="cuisine">
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rating (Optional)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRatingClick(value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            value <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {!gamificationReward && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {/* Authentication Status */}
              <div className="w-full text-sm text-gray-600 mb-2">
                {user ? (
                  <span className="text-green-600">✅ Signed in as {user.email}</span>
                ) : (
                  <span className="text-red-600">❌ Please sign in to save photos</span>
                )}
              </div>
              
              <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleTaggingSubmit} 
                className="w-full sm:w-auto"
                disabled={saving || !user}
              >
                {saving ? 'Saving...' : 'Save to Plate'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Default State - Show button to start */}
      {!showCamera && !showTagging && !showDisclaimer && (
        <div className="flex flex-col items-center gap-4 p-8">
          <Camera className="h-16 w-16 text-muted-foreground" />
          <h2>Ready to SNAP?</h2>
          <Button onClick={() => setShowDisclaimer(true)} size="lg">
            Start Camera
          </Button>
        </div>
      )}
    </div>
  );
}