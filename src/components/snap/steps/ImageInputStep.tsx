import { useState, useRef, useEffect } from 'react';
import { CameraAlt, Upload } from '@mui/icons-material';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { MinimalHeader } from '../../common/MinimalHeader';
import type { ImageMetadata } from '../../../types/snap';

interface ImageInputStepProps {
  onImageCaptured: (imageUrl: string, metadata: any) => void;
  onCancel: () => void;
}

const MOCK_CAMERA_MODE = false;

export function ImageInputStep({ onImageCaptured, onCancel }: ImageInputStepProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
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
    } finally {
      setCameraLoading(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
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

      onImageCaptured(imageData, { ...metadata, source: 'camera' });
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo');
    }
  };

  // Get geolocation
  const getGeolocation = (): Promise<Omit<ImageMetadata, 'imageData' | 'source'>> => {
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

  // Handle gallery upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Validate file
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or WebP image');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      // Read as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;

        // Get metadata
        const metadata = await getGeolocation();

        onImageCaptured(imageData, {
          ...metadata,
          source: 'gallery',
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

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

  // Camera view
  if (showCamera) {
    const handleBackClick = () => {
      setShowCamera(false);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        setStream(null);
      }
    };

    return (
      <div className="w-full max-w-sm mx-auto bg-black min-h-screen flex flex-col">
        {/* Header */}
        <div className="py-3 px-5 border-b border-gray-700 flex items-center justify-between bg-black">
          <button onClick={handleBackClick} className="text-white hover:text-gray-300">←</button>
          <h2 className="font-semibold text-white text-center flex-1">Capture Photo</h2>
          <div className="w-6" />
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="bg-black/80 p-4 space-y-3">
          <Button
            onClick={capturePhoto}
            className="w-full bg-gradient-to-r from-[#FFC909] to-[#E6B508] text-white"
          >
            Capture Photo
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowCamera(false);
              if (stream) {
                for (const track of stream.getTracks()) {
                  track.stop();
                }
                setStream(null);
              }
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="w-full max-w-sm mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="py-3 px-5 border-b">
        <h2 className="font-semibold text-gray-900">Add Photo</h2>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h2 className="font-[Poppins] font-bold text-2xl text-gray-900 mb-2">
            How to SNAP?
          </h2>
          <p className="text-gray-600">Choose your image source</p>
        </div>

        {/* Camera option */}
        <button
          onClick={startCamera}
          disabled={cameraLoading}
          className="p-6 border-2 border-gray-200 rounded-2xl hover:border-[#FFC909] hover:bg-orange-50 transition space-y-3 text-center disabled:opacity-50"
        >
          <CameraAlt className="w-12 h-12 mx-auto text-[#FFC909]" />
          <div>
            <h3 className="font-semibold text-gray-900">📸 Camera</h3>
            <p className="text-sm text-gray-600">Capture a new photo</p>
          </div>
        </button>

        {/* Gallery option */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-6 border-2 border-gray-200 rounded-2xl hover:border-[#FFC909] hover:bg-orange-50 transition space-y-3 text-center disabled:opacity-50"
        >
          <Upload className="w-12 h-12 mx-auto text-[#FFC909]" />
          <div>
            <h3 className="font-semibold text-gray-900">📁 Gallery</h3>
            <p className="text-sm text-gray-600">Upload from your device</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Cancel button */}
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full mt-8"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
