'use client';

import React, { useState, useRef } from 'react';
import { Camera, RotateCw, X } from 'lucide-react';
import { Button } from '../ui/button';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  imageBlob: Blob;
  timestamp: Date;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple camera initialization
  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setHasPermission(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
    }
  };

  // Simple photo capture
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas not available');
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Canvas context not available');
        setIsCapturing(false);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/jpeg', 0.9);
      });

      // Create photo object
      const imageUrl = URL.createObjectURL(blob);
      const photo: CapturedPhoto = {
        id: Date.now().toString(),
        imageUrl,
        imageBlob: blob,
        timestamp: new Date(),
      };

      console.log('Photo captured successfully');
      onPhotoCapture(photo);
      
    } catch (error) {
      console.error('Photo capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    stopCamera();
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
    // Wait a bit then restart camera
    setTimeout(() => startCamera(), 100);
  };

  // Auto-start camera when component mounts
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera view */}
      <div className="relative h-full w-full">
        {/* Video element */}
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* UI Controls */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCamera}
              className="rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <RotateCw className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Camera permission status */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <Camera className="mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">Camera Access Required</h3>
                <p className="mb-4 text-sm">Please allow camera access to take photos.</p>
                <Button onClick={startCamera} variant="outline">
                  Enable Camera
                </Button>
              </div>
            </div>
          )}
          
          {/* Bottom controls */}
          <div className="mt-auto flex items-center justify-center p-8">
            <Button
              onClick={capturePhoto}
              disabled={isCapturing || hasPermission === false}
              size="lg"
              className="rounded-full bg-white p-6 text-black hover:bg-gray-200 disabled:opacity-50"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}