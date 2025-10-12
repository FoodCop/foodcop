// Media and Status Utility Functions for Phase 4
// Advanced Features - Media Attachments and Status/Presence Management

import { MediaFile, CompressionOptions, FileValidationResult, VoiceRecording, UserPresence, ReadReceipt } from './ChatTypes';

// ============================================================================
// MEDIA UTILITIES
// ============================================================================

/**
 * Validates file against specified criteria
 */
export const validateFile = (
  file: File,
  options: {
    maxSize: number;
    allowedTypes: string[];
    allowedExtensions?: string[];
  }
): FileValidationResult => {
  // Check file size
  if (file.size > options.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${(options.maxSize / 1024 / 1024).toFixed(1)}MB limit`,
      suggestedCompression: file.type.startsWith('image/') 
        ? { quality: 0.6, maxWidth: 1920, maxHeight: 1080 }
        : undefined
    };
  }

  // Check MIME type
  const isValidType = options.allowedTypes.some(type => file.type.startsWith(type));
  if (!isValidType) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  // Check file extension if specified
  if (options.allowedExtensions) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = fileExtension && options.allowedExtensions.includes(fileExtension);
    if (!isValidExtension) {
      return {
        isValid: false,
        error: `File extension .${fileExtension} is not allowed`
      };
    }
  }

  // Check for potential optimization opportunities
  const warnings: string[] = [];
  let suggestedCompression: CompressionOptions | undefined;

  if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
    warnings.push('Large image file - compression recommended');
    suggestedCompression = { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
  }

  if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
    warnings.push('Large video file - may take longer to upload');
  }

  return {
    isValid: true,
    warnings,
    suggestedCompression
  };
};

/**
 * Compresses an image file
 */
export const compressImage = (file: File, options: CompressionOptions): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
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
          reject(new Error('Compression failed'));
        }
      }, options.format ? `image/${options.format}` : file.type, options.quality);
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gets image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gets video metadata (dimensions, duration, thumbnail)
 */
export const getVideoMetadata = (file: File): Promise<{
  dimensions: { width: number; height: number };
  duration: number;
  thumbnail: string;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1); // 10% or 1 second
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
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
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Gets audio duration
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => reject(new Error('Failed to load audio'));
    audio.src = URL.createObjectURL(file);
  });
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets file type category from MIME type
 */
export const getFileTypeCategory = (mimeType: string): 'image' | 'video' | 'audio' | 'document' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

/**
 * Creates a thumbnail for various file types
 */
export const createThumbnail = async (file: File, size: number = 200): Promise<string | null> => {
  const type = getFileTypeCategory(file.type);
  
  switch (type) {
    case 'image':
      try {
        const compressed = await compressImage(file, {
          quality: 0.7,
          maxWidth: size,
          maxHeight: size,
          format: 'jpeg'
        });
        return URL.createObjectURL(compressed);
      } catch {
        return null;
      }
      
    case 'video':
      try {
        const metadata = await getVideoMetadata(file);
        return metadata.thumbnail;
      } catch {
        return null;
      }
      
    default:
      return null;
  }
};

// ============================================================================
// VOICE RECORDING UTILITIES
// ============================================================================

/**
 * Gets user media for voice recording
 */
export const getUserMedia = async (constraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
}): Promise<MediaStream> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia is not supported');
  }
  
  return navigator.mediaDevices.getUserMedia(constraints);
};

/**
 * Creates audio recorder with specified options
 */
export const createAudioRecorder = (stream: MediaStream, options: {
  mimeType?: string;
  audioBitsPerSecond?: number;
} = {}): MediaRecorder => {
  const defaultOptions = {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Check if the specified MIME type is supported
  if (!MediaRecorder.isTypeSupported(mergedOptions.mimeType)) {
    mergedOptions.mimeType = 'audio/webm'; // Fallback
  }
  
  return new MediaRecorder(stream, mergedOptions);
};

/**
 * Analyzes audio for waveform visualization
 */
export const createAudioAnalyser = (stream: MediaStream): {
  analyser: AnalyserNode;
  getWaveformData: () => number[];
  getVolumeLevel: () => number;
} => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  analyser.fftSize = 256;
  source.connect(analyser);
  
  const getWaveformData = (): number[] => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Convert to normalized values (0-1)
    return Array.from(dataArray).map(value => value / 255);
  };
  
  const getVolumeLevel = (): number => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    return average / 255;
  };
  
  return { analyser, getWaveformData, getVolumeLevel };
};

// ============================================================================
// STATUS AND PRESENCE UTILITIES
// ============================================================================

/**
 * Formats last seen timestamp
 */
export const formatLastSeen = (lastSeen: string): string => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return lastSeenDate.toLocaleDateString();
};

/**
 * Gets status color for presence indicator
 */
export const getPresenceColor = (status: UserPresence['status']): string => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    case 'invisible':
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

/**
 * Gets status text for presence
 */
export const getPresenceText = (status: UserPresence['status']): string => {
  switch (status) {
    case 'online': return 'Online';
    case 'away': return 'Away';
    case 'busy': return 'Busy';
    case 'invisible': return 'Invisible';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};

/**
 * Creates a debounced activity tracker
 */
export const createActivityTracker = (
  onActivity: (activity: string) => void,
  debounceMs: number = 1000
) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (activity: string) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    onActivity(activity);
    
    timeout = setTimeout(() => {
      onActivity('idle');
    }, debounceMs);
  };
};

// ============================================================================
// READ RECEIPT UTILITIES
// ============================================================================

/**
 * Calculates read receipt status for a message
 */
export const calculateReceiptStatus = (
  messageId: string,
  receipts: ReadReceipt[],
  totalParticipants: number
): {
  status: 'sent' | 'delivered' | 'partially_delivered' | 'read';
  deliveredCount: number;
  readCount: number;
} => {
  const messageReceipts = receipts.filter(r => r.message_id === messageId);
  const deliveredCount = messageReceipts.filter(r => r.delivered_at).length;
  const readCount = messageReceipts.filter(r => r.read_at).length;
  
  if (readCount === totalParticipants) {
    return { status: 'read', deliveredCount, readCount };
  } else if (deliveredCount === totalParticipants) {
    return { status: 'delivered', deliveredCount, readCount };
  } else if (deliveredCount > 0) {
    return { status: 'partially_delivered', deliveredCount, readCount };
  } else {
    return { status: 'sent', deliveredCount, readCount };
  }
};

/**
 * Formats time for read receipts
 */
export const formatReceiptTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

/**
 * Creates a unique ID for media files
 */
export const generateMediaId = (): string => {
  return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates a URL for blob objects with cleanup
 */
export const createBlobUrl = (blob: Blob): { url: string; cleanup: () => void } => {
  const url = URL.createObjectURL(blob);
  return {
    url,
    cleanup: () => URL.revokeObjectURL(url)
  };
};

/**
 * Checks browser capabilities for media features
 */
export const checkBrowserCapabilities = (): {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasWebRTC: boolean;
  hasMediaRecorder: boolean;
  supportedFormats: string[];
} => {
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasMicrophone = hasCamera;
  const hasWebRTC = !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection);
  const hasMediaRecorder = !!(window.MediaRecorder);
  
  const supportedFormats: string[] = [];
  if (hasMediaRecorder) {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ];
    
    formats.forEach(format => {
      if (MediaRecorder.isTypeSupported(format)) {
        supportedFormats.push(format);
      }
    });
  }
  
  return {
    hasCamera,
    hasMicrophone,
    hasWebRTC,
    hasMediaRecorder,
    supportedFormats
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce function for input handling
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};