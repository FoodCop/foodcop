import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, Image, X } from 'lucide-react';
import { Button } from '../ui/button';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface CameraViewProps {
  onPhotoCapture: (photo: CapturedPhoto) => void;
}

export function CameraView({ onPhotoCapture }: CameraViewProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock gallery images for demo
  const recentPhotos = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=100&h=100&fit=crop'
  ];

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, [cameraFacing]);

  const initializeCamera = async () => {
    try {
      // In a real app, this would access the actual camera
      // For demo purposes, we'll simulate camera permission and show a placeholder
      setHasPermission(true);
      
      // Simulate camera stream (in real app, use getUserMedia)
      if (videoRef.current) {
        // This would be: videoRef.current.srcObject = stream;
        videoRef.current.style.backgroundImage = "url('https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop')";
        videoRef.current.style.backgroundSize = 'cover';
        videoRef.current.style.backgroundPosition = 'center';
      }
    } catch (error) {
      setHasPermission(false);
      console.error('Camera access denied:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      // Get current location
      const position = await getCurrentLocation();
      
      // In a real app, this would capture from the video stream
      // For demo, we'll use a sample food image
      const sampleImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
      ];
      
      const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      
      const photo: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        imageUrl: randomImage,
        timestamp: new Date(),
        location: position ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Current Location' // Would use reverse geocoding in real app
        } : undefined
      };

      // Simulate capture delay
      setTimeout(() => {
        setIsCapturing(false);
        onPhotoCapture(photo);
      }, 500);

    } catch (error) {
      console.error('Error capturing photo:', error);
      setIsCapturing(false);
    }
  };

  const flipCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <Camera className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl mb-2">Camera Access Needed</h2>
          <p className="text-gray-300 mb-4">
            FUZO needs camera access to help you snap and share your food discoveries.
          </p>
          <Button 
            onClick={initializeCamera}
            className="bg-primary hover:bg-primary/90"
          >
            Enable Camera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Camera Preview */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Corner Guides */}
      <div className="absolute top-8 left-8 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg opacity-60" />
      <div className="absolute top-8 right-8 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg opacity-60" />
      <div className="absolute bottom-32 left-8 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg opacity-60" />
      <div className="absolute bottom-32 right-8 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg opacity-60" />

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 pt-12">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-lg">Snap Your Food</h1>
            <p className="text-sm text-gray-300">Discover & Share</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => window.history.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8">
        <div className="flex items-center justify-between">
          {/* Gallery Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30">
            <img 
              src={recentPhotos[0]} 
              alt="Recent photo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Shutter Button */}
          <div className="relative">
            <Button
              size="icon"
              onClick={capturePhoto}
              disabled={isCapturing}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black border-4 border-primary shadow-lg relative overflow-hidden"
            >
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary" />
              )}
            </Button>
            
            {/* Capture animation overlay */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white rounded-full animate-ping" />
            )}
          </div>

          {/* Flip Camera */}
          <Button
            size="icon"
            variant="ghost"
            onClick={flipCamera}
            className="w-12 h-12 rounded-full text-white hover:bg-white/20"
          >
            <RotateCw className="h-6 w-6" />
          </Button>
        </div>

        {/* Capture Hint */}
        <div className="text-center mt-4">
          <p className="text-white/70 text-sm">
            Tap to capture your food moment
          </p>
        </div>
      </div>

      {/* Flash overlay for capture effect */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white animate-pulse" style={{ animationDuration: '200ms' }} />
      )}
    </div>
  );
}
