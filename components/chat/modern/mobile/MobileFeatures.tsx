// Mobile-Specific Features Component
// Haptic feedback, device orientation, background state management

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef,
  createContext,
  useContext 
} from 'react';
import { cn } from '@/lib/utils';

// Device capabilities interface
interface DeviceCapabilities {
  hasVibration: boolean;
  hasGeolocation: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasNotifications: boolean;
  hasOrientation: boolean;
  isTouchDevice: boolean;
  isStandalone: boolean;
  platform: string;
  screenSize: 'small' | 'medium' | 'large';
}

// Device orientation interface
interface DeviceOrientation {
  angle: number;
  type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
  isPortrait: boolean;
  isLandscape: boolean;
}

// Background state interface
interface BackgroundState {
  isVisible: boolean;
  isActive: boolean;
  lastActiveTime: number;
  timeInBackground: number;
}

// Haptic feedback patterns
export enum HapticPattern {
  LIGHT = 'light',
  MEDIUM = 'medium', 
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT = 'impact'
}

// Device Capabilities Hook
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    hasVibration: false,
    hasGeolocation: false,
    hasCamera: false,
    hasMicrophone: false,
    hasNotifications: false,
    hasOrientation: false,
    isTouchDevice: false,
    isStandalone: false,
    platform: 'unknown',
    screenSize: 'medium'
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities: DeviceCapabilities = {
        hasVibration: 'vibrate' in navigator,
        hasGeolocation: 'geolocation' in navigator,
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasNotifications: 'Notification' in window,
        hasOrientation: 'orientation' in screen || 'mozOrientation' in screen,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true,
        platform: getPlatform(),
        screenSize: getScreenSize()
      };

      // Check camera/microphone permissions
      if (newCapabilities.hasCamera) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          newCapabilities.hasCamera = true;
        } catch {
          newCapabilities.hasCamera = false;
        }
      }

      if (newCapabilities.hasMicrophone) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          newCapabilities.hasMicrophone = true;
        } catch {
          newCapabilities.hasMicrophone = false;
        }
      }

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  const getPlatform = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    return 'unknown';
  };

  const getScreenSize = (): 'small' | 'medium' | 'large' => {
    const width = window.innerWidth;
    if (width < 640) return 'small';
    if (width < 1024) return 'medium';
    return 'large';
  };

  return capabilities;
};

// Enhanced Haptic Feedback Hook
export const useHapticFeedback = () => {
  const capabilities = useDeviceCapabilities();

  const triggerHaptic = useCallback((pattern: HapticPattern, intensity: number = 1) => {
    if (!capabilities.hasVibration) return;

    const patterns = {
      [HapticPattern.LIGHT]: [10],
      [HapticPattern.MEDIUM]: [50],
      [HapticPattern.HEAVY]: [100],
      [HapticPattern.SUCCESS]: [25, 25, 50],
      [HapticPattern.WARNING]: [50, 25, 50],
      [HapticPattern.ERROR]: [100, 50, 100, 50, 100],
      [HapticPattern.SELECTION]: [10],
      [HapticPattern.IMPACT]: [25]
    };

    const patternArray = patterns[pattern] || patterns[HapticPattern.LIGHT];
    const adjustedPattern = patternArray.map(duration => Math.round(duration * intensity));

    if (navigator.vibrate) {
      navigator.vibrate(adjustedPattern);
    }
  }, [capabilities.hasVibration]);

  // iOS-specific haptic feedback
  const triggerIOSHaptic = useCallback((type: 'impact' | 'notification' | 'selection', style?: string) => {
    if (capabilities.platform !== 'ios') return;

    // This would require iOS-specific implementation
    // For now, fallback to regular vibration
    if (type === 'impact') {
      triggerHaptic(HapticPattern.IMPACT);
    } else if (type === 'selection') {
      triggerHaptic(HapticPattern.SELECTION);
    } else {
      triggerHaptic(HapticPattern.MEDIUM);
    }
  }, [capabilities.platform, triggerHaptic]);

  return {
    triggerHaptic,
    triggerIOSHaptic,
    isSupported: capabilities.hasVibration
  };
};

// Device Orientation Hook
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    angle: 0,
    type: 'portrait-primary',
    isPortrait: true,
    isLandscape: false
  });

  useEffect(() => {
    const updateOrientation = () => {
      const angle = screen.orientation?.angle || (window as any).orientation || 0;
      const type = screen.orientation?.type || getOrientationFromAngle(angle);
      
      setOrientation({
        angle,
        type: type as DeviceOrientation['type'],
        isPortrait: type.includes('portrait'),
        isLandscape: type.includes('landscape')
      });
    };

    const getOrientationFromAngle = (angle: number): string => {
      switch (angle) {
        case 0: return 'portrait-primary';
        case 90: return 'landscape-primary';
        case 180: return 'portrait-secondary';
        case -90:
        case 270: return 'landscape-secondary';
        default: return 'portrait-primary';
      }
    };

    // Initial check
    updateOrientation();

    // Listen for orientation changes
    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateOrientation);
    } else {
      window.addEventListener('orientationchange', updateOrientation);
    }

    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', updateOrientation);
      } else {
        window.removeEventListener('orientationchange', updateOrientation);
      }
    };
  }, []);

  const lockOrientation = useCallback(async (orientation: OrientationLockType) => {
    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock(orientation);
        return true;
      } catch (error) {
        console.warn('Failed to lock orientation:', error);
        return false;
      }
    }
    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }, []);

  return {
    orientation,
    lockOrientation,
    unlockOrientation
  };
};

// Background State Hook
export const useBackgroundState = () => {
  const [backgroundState, setBackgroundState] = useState<BackgroundState>({
    isVisible: !document.hidden,
    isActive: document.hasFocus(),
    lastActiveTime: Date.now(),
    timeInBackground: 0
  });

  const backgroundStartTime = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();
      
      if (!isVisible && backgroundStartTime.current === null) {
        backgroundStartTime.current = now;
      } else if (isVisible && backgroundStartTime.current !== null) {
        const timeInBackground = now - backgroundStartTime.current;
        backgroundStartTime.current = null;
        
        setBackgroundState(prev => ({
          ...prev,
          isVisible: true,
          lastActiveTime: now,
          timeInBackground: prev.timeInBackground + timeInBackground
        }));
      }

      setBackgroundState(prev => ({
        ...prev,
        isVisible,
        lastActiveTime: isVisible ? now : prev.lastActiveTime
      }));
    };

    const handleFocus = () => {
      setBackgroundState(prev => ({
        ...prev,
        isActive: true,
        lastActiveTime: Date.now()
      }));
    };

    const handleBlur = () => {
      setBackgroundState(prev => ({
        ...prev,
        isActive: false
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return backgroundState;
};

// Screen Wake Lock Hook
export const useWakeLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsLocked(true);
        
        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
        });
        
        return true;
      } catch (error) {
        console.error('Failed to request wake lock:', error);
        return false;
      }
    }
    return false;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsLocked(false);
        return true;
      } catch (error) {
        console.error('Failed to release wake lock:', error);
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    // Auto-release on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isLocked,
    requestWakeLock,
    releaseWakeLock,
    isSupported: 'wakeLock' in navigator
  };
};

// Mobile-specific UI Context
interface MobileContextType {
  capabilities: DeviceCapabilities;
  orientation: DeviceOrientation;
  backgroundState: BackgroundState;
  haptic: {
    triggerHaptic: (pattern: HapticPattern, intensity?: number) => void;
    isSupported: boolean;
  };
}

const MobileContext = createContext<MobileContextType | null>(null);

// Mobile Provider Component
interface MobileProviderProps {
  children: React.ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const capabilities = useDeviceCapabilities();
  const { orientation } = useDeviceOrientation();
  const backgroundState = useBackgroundState();
  const { triggerHaptic, isSupported } = useHapticFeedback();

  const contextValue: MobileContextType = {
    capabilities,
    orientation,
    backgroundState,
    haptic: {
      triggerHaptic,
      isSupported
    }
  };

  return (
    <MobileContext.Provider value={contextValue}>
      <div 
        className={cn(
          "mobile-optimized",
          capabilities.isTouchDevice && "touch-device",
          orientation.isPortrait ? "portrait" : "landscape",
          capabilities.screenSize === 'small' && "small-screen",
          capabilities.isStandalone && "standalone-app"
        )}
        data-platform={capabilities.platform}
      >
        {children}
      </div>
    </MobileContext.Provider>
  );
};

// Hook to use mobile context
export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

// Responsive Image Component with device optimization
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  onLoad
}) => {
  const { capabilities } = useMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState('');

  useEffect(() => {
    // Determine optimal image size based on device capabilities
    const getOptimalImageSrc = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.innerWidth;
      
      // Calculate optimal width based on screen size and pixel density
      let optimalWidth: number;
      
      if (capabilities.screenSize === 'small') {
        optimalWidth = Math.min(screenWidth * devicePixelRatio, 800);
      } else if (capabilities.screenSize === 'medium') {
        optimalWidth = Math.min(screenWidth * devicePixelRatio, 1200);
      } else {
        optimalWidth = Math.min(screenWidth * devicePixelRatio, 1600);
      }
      
      // If the original src includes query parameters for resizing, use them
      if (src.includes('?') || src.includes('w=') || src.includes('width=')) {
        return src;
      }
      
      // For Supabase or other image services, append width parameter
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}width=${Math.round(optimalWidth)}&quality=80`;
    };

    setCurrentSrc(getOptimalImageSrc());
  }, [src, capabilities.screenSize]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
};

// Export all mobile components
export const MobileFeatures = {
  useDeviceCapabilities,
  useHapticFeedback,
  useDeviceOrientation,
  useBackgroundState,
  useWakeLock,
  MobileProvider,
  useMobile,
  ResponsiveImage,
  HapticPattern
};