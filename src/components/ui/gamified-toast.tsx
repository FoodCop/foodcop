import { toast } from 'sonner';

interface GamifiedToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  showContinue?: boolean;
  onContinue?: () => void;
  continueText?: string;
}

// Track active toasts to prevent duplicates
const activeToasts = new Map<string, number>();
const TOAST_COOLDOWN = 3000; // 3 seconds cooldown between same notifications

// Helper to convert hex to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const colorMap = {
  success: {
    bg: '#D97706', // Ocher yellow
    text: '#FFFFFF',
    border: '#B45309',
    icon: 'fa-circle-check',
    defaultTitle: 'Success',
  },
  error: {
    bg: '#DC2626', // Fire engine red
    text: '#FFFFFF',
    border: '#B91C1C',
    icon: 'fa-circle-xmark',
    defaultTitle: 'Error',
  },
  warning: {
    bg: '#FF6B35', // Orange
    text: '#FFFFFF',
    border: '#EA580C',
    icon: 'fa-triangle-exclamation',
    defaultTitle: 'Warning',
  },
  info: {
    bg: '#FF6B35', // Orange
    text: '#FFFFFF',
    border: '#EA580C',
    icon: 'fa-circle-info',
    defaultTitle: 'Info',
  },
};

export const gamifiedToast = (options: GamifiedToastOptions) => {
  const { message, type, title, showContinue = false, onContinue, continueText = 'Continue' } = options;
  const colors = colorMap[type];
  const displayTitle = title || colors.defaultTitle;

  // Create a unique key for this toast based on message and type
  const toastKey = `${type}-${message}`;
  const now = Date.now();
  
  // Check if this exact toast was shown recently
  const lastShown = activeToasts.get(toastKey);
  if (lastShown && (now - lastShown) < TOAST_COOLDOWN) {
    // Toast was shown recently, don't show it again
    return null;
  }
  
  // Mark this toast as shown
  activeToasts.set(toastKey, now);
  
  // Clean up old entries (older than cooldown period)
  for (const [key, timestamp] of activeToasts.entries()) {
    if (now - timestamp > TOAST_COOLDOWN) {
      activeToasts.delete(key);
    }
  }

  return toast.custom((t) => (
    <div
      className="bg-white rounded-xl shadow-lg p-6 w-96 pointer-events-auto border-2"
      style={{
        borderColor: colors.border,
        fontSize: '12pt',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          {/* Icon with circular background - only colored element */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
            style={{ backgroundColor: hexToRgba(colors.bg, 0.10) }}
          >
            <i 
              className={`fa-solid ${colors.icon} text-2xl`}
              style={{ color: colors.bg }}
            />
          </div>
          
          {/* Title and Message - grey text on white background */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {displayTitle}
            </h3>
            <p className="text-sm" style={{ color: '#808080' }}>
              {message}
            </p>
          </div>
        </div>
        
        {/* Action Button - Continue or Close */}
        {showContinue ? (
          <button
            onClick={() => {
              onContinue?.();
              toast.dismiss(t);
            }}
            className="ml-4 px-5 py-2 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{
              backgroundColor: colors.bg,
            }}
          >
            {continueText}
          </button>
        ) : (
          <button
            onClick={() => toast.dismiss(t)}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        )}
      </div>
    </div>
  ), {
    duration: showContinue ? Infinity : 4000,
  });
};

