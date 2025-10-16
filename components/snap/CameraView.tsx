'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, X, MapPin, Clock } from 'lucide-react';
import { Button } from '../ui/button';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  imageBlob: Blob;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface CameraViewProps {
  onPhotoCapture: (photo: CapturedPhoto) => void;
  onClose: () => void;
}

export function CameraView({ onPhotoCapture, onClose }: CameraViewProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const checkLocationPermission = React.useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        setLocationStatus('granted');
      } else if (permission.state === 'denied') {
        setLocationStatus('denied');
      } else {
        setLocationStatus('loading');
      }
    } catch (error) {
      setLocationStatus('unavailable');
    }
  }, []);

  const initializeCamera = React.useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setHasPermission(true);
    } catch (error) {
      setHasPermission(false);
      console.error('Camera access denied:', error);
    }
  }, [cameraFacing]);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  useEffect(() => {
    initializeCamera();
    checkLocationPermission();
    return () => {
      stopCamera();
    };
  }, [initializeCamera, checkLocationPermission, stopCamera]);

  const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus('granted');
          resolve(position);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus('denied');
          resolve(null);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    });
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      
      if (data.success && data.address) {
        return data.address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return undefined;
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.92);
      });

      // Get current location
      const position = await getCurrentLocation();
      let locationData = undefined;

      if (position) {
        const address = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );

        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: address || 'Unknown location'
        };
      }

      const photo: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        imageUrl: canvas.toDataURL('image/jpeg', 0.92),
        imageBlob: blob,
        timestamp: new Date(),
        location: locationData
      };

      // Simulate capture delay for better UX
      setTimeout(() => {
        setIsCapturing(false);
        onPhotoCapture(photo);
      }, 300);

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
            FoodCop needs camera access to help you snap and discover food.
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

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Initializing camera...</p>
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
            <h1 className="text-lg font-semibold">Snap Your Food</h1>
            <div className="flex items-center text-sm text-gray-300 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              
              {locationStatus === 'granted' && (
                <>
                  <MapPin className="h-3 w-3 ml-3 mr-1" />
                  <span>Location enabled</span>
                </>
              )}
              
              {locationStatus === 'denied' && (
                <>
                  <MapPin className="h-3 w-3 ml-3 mr-1 text-red-400" />
                  <span className="text-red-400">No location</span>
                </>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8">
        <div className="flex items-center justify-between">
          {/* Empty space for symmetry */}
          <div className="w-12 h-12" />

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
          {locationStatus === 'loading' && (
            <p className="text-white/50 text-xs mt-1">
              Getting location...
            </p>
          )}
        </div>
      </div>

      {/* Flash overlay for capture effect */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white animate-pulse" style={{ animationDuration: '200ms' }} />
      )}
    </div>
  );
}