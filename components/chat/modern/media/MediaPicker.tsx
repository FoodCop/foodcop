'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  ImageIcon, 
  Video, 
  FileText, 
  Music,
  X, 
  Plus,
  Settings,
  Check,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { MediaFile, MediaPickerOptions, FileValidationResult, CompressionOptions } from '../utils/ChatTypes';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaSelect: (files: MediaFile[]) => void;
  options?: Partial<MediaPickerOptions>;
  currentFiles?: MediaFile[];
}

const DEFAULT_OPTIONS: MediaPickerOptions = {
  maxFiles: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image', 'video', 'audio', 'document'],
  enableCamera: true,
  enableCompression: true,
  compressionQuality: 0.8,
};

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onMediaSelect,
  options: userOptions = {},
  currentFiles = []
}) => {
  const options = useMemo(() => ({ ...DEFAULT_OPTIONS, ...userOptions }), [userOptions]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>(currentFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('gallery');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(options.enableCompression);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File validation utility
  const validateFile = useCallback((file: File): FileValidationResult => {
    // Check file size
    if (file.size > options.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${(options.maxFileSize / 1024 / 1024).toFixed(1)}MB limit`,
        suggestedCompression: file.type.startsWith('image/') 
          ? { quality: 0.6, maxWidth: 1920, maxHeight: 1080 }
          : undefined
      };
    }

    // Check file type
    const fileType = getFileType(file);
    if (!options.allowedTypes.includes(fileType)) {
      return {
        isValid: false,
        error: `File type ${fileType} is not allowed`
      };
    }

    // Check for potential compression benefits
    const warnings: string[] = [];
    let suggestedCompression: CompressionOptions | undefined;

    if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
      warnings.push('Large image file - compression recommended');
      suggestedCompression = { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
    }

    return {
      isValid: true,
      warnings,
      suggestedCompression
    };
  }, [options]);

  // Get file type from MIME type
  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  // Create MediaFile from File
  const createMediaFile = useCallback(async (file: File, compressed = false): Promise<MediaFile> => {
    const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = URL.createObjectURL(file);
    const type = getFileType(file);
    
    let dimensions: { width: number; height: number } | undefined;
    let duration: number | undefined;
    let thumbnail: string | undefined;

    // Extract metadata for images and videos
    if (type === 'image') {
      dimensions = await getImageDimensions(file);
    } else if (type === 'video') {
      const metadata = await getVideoMetadata(file);
      dimensions = metadata.dimensions;
      duration = metadata.duration;
      thumbnail = metadata.thumbnail;
    } else if (type === 'audio') {
      duration = await getAudioDuration(file);
    }

    return {
      id,
      type,
      file,
      url,
      thumbnail,
      size: file.size,
      duration,
      dimensions,
      metadata: {
        filename: file.name,
        mimeType: file.type,
        compressed,
        uploadProgress: 0
      }
    };
  }, []);

  // Image dimensions helper
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Video metadata helper
  const getVideoMetadata = (file: File): Promise<{ 
    dimensions: { width: number; height: number }; 
    duration: number;
    thumbnail: string;
  }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(1, video.duration * 0.1); // 10% or 1 second
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        resolve({
          dimensions: { width: video.videoWidth, height: video.videoHeight },
          duration: video.duration,
          thumbnail
        });
        
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Audio duration helper
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  // Compress image
  const compressImage = useCallback((file: File, options: CompressionOptions): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        let { width, height } = img;
        
        // Apply max dimensions if specified
        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }
        
        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: options.format ? `image/${options.format}` : file.type,
              lastModified: file.lastModified
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, options.format ? `image/${options.format}` : file.type, options.quality);
        
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const newFiles: MediaFile[] = [];
    
    setIsUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        console.warn(`File ${file.name}: ${validation.error}`);
        continue;
      }
      
      try {
        let processedFile = file;
        
        // Apply compression if enabled and suggested
        if (compressionEnabled && validation.suggestedCompression && file.type.startsWith('image/')) {
          processedFile = await compressImage(file, validation.suggestedCompression);
        }
        
        const mediaFile = await createMediaFile(processedFile, processedFile !== file);
        newFiles.push(mediaFile);
        
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    // Check total file limit
    const totalFiles = selectedFiles.length + newFiles.length;
    if (totalFiles > options.maxFiles) {
      const allowedCount = options.maxFiles - selectedFiles.length;
      setSelectedFiles(prev => [...prev, ...newFiles.slice(0, allowedCount)]);
    } else {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  }, [selectedFiles, options.maxFiles, validateFile, compressionEnabled, compressImage, createMediaFile]);

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        
        const mediaFile = await createMediaFile(file);
        setSelectedFiles(prev => [...prev, mediaFile]);
        stopCamera();
        setActiveTab('gallery');
      }
    }, 'image/jpeg', 0.9);
  }, [createMediaFile, stopCamera]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    onMediaSelect(selectedFiles);
    setSelectedFiles([]);
    onClose();
  }, [selectedFiles, onMediaSelect, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      selectedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [selectedFiles, stopCamera]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Select Media
            {selectedFiles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedFiles.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2" disabled={!options.enableCamera}>
              <Camera className="w-4 h-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 flex flex-col mt-4">
            <TabsContent value="gallery" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add from Gallery
                </Button>
                
                {options.enableCompression && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompressionEnabled(!compressionEnabled)}
                    className={`flex items-center gap-2 ${compressionEnabled ? 'text-orange-600' : ''}`}
                  >
                    <Settings className="w-4 h-4" />
                    Compression {compressionEnabled ? 'On' : 'Off'}
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={options.allowedTypes.map(type => {
                  switch (type) {
                    case 'image': return 'image/*';
                    case 'video': return 'video/*';
                    case 'audio': return 'audio/*';
                    default: return '*/*';
                  }
                }).join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing files...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex-1 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                        {file.type === 'image' ? (
                          <img
                            src={file.url}
                            alt={file.metadata?.filename || 'Selected image'}
                            className="w-full h-full object-cover"
                          />
                        ) : file.type === 'video' ? (
                          <div className="relative w-full h-full">
                            {file.thumbnail ? (
                              <img
                                src={file.thumbnail}
                                alt={file.metadata?.filename || 'Video thumbnail'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Video className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                              {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toFixed(0).padStart(2, '0')}` : '--:--'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium truncate">
                          {file.metadata?.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.metadata?.compressed && (
                          <Badge variant="secondary" className="text-xs">
                            Compressed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="flex-1 flex flex-col">
              <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={stopCamera}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100"
                      >
                        <Camera className="w-6 h-6 text-black" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Button onClick={startCamera} size="lg" className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 flex flex-col">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2 mb-4"
              >
                <Plus className="w-4 h-4" />
                Select Files
              </Button>

              <div className="flex-1 max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {selectedFiles.filter(f => f.type === 'document' || f.type === 'audio').map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.metadata?.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedFiles.length}/{options.maxFiles} files selected
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={selectedFiles.length === 0}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Send ({selectedFiles.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPicker;