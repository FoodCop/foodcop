import { toast } from 'sonner';
import { Star, X } from 'lucide-react';
import { Button } from './button';

interface GamifiedToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showStar?: boolean;
  showContinue?: boolean;
  onContinue?: () => void;
  continueText?: string;
}

// Track active toasts to prevent duplicates
const activeToasts = new Map<string, number>();
const TOAST_COOLDOWN = 3000; // 3 seconds cooldown between same notifications

const colorMap = {
  success: {
    bg: '#D97706', // Ocher yellow
    text: '#FFFFFF',
    border: '#B45309',
  },
  error: {
    bg: '#DC2626', // Fire engine red
    text: '#FFFFFF',
    border: '#B91C1C',
  },
  warning: {
    bg: '#FF6B35', // Orange
    text: '#FFFFFF',
    border: '#EA580C',
  },
  info: {
    bg: '#FF6B35', // Orange
    text: '#FFFFFF',
    border: '#EA580C',
  },
};

export const gamifiedToast = (options: GamifiedToastOptions) => {
  const { message, type, showStar = false, showContinue = false, onContinue, continueText = 'Continue' } = options;
  const colors = colorMap[type];

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
      className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
      style={{ fontSize: '12pt' }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-7 max-w-md w-full mx-4 pointer-events-auto border-2"
        style={{
          borderColor: colors.bg,
        }}
      >
        <div className="flex items-start gap-4">
          {showStar && (
            <div className="flex-shrink-0 mt-0.5">
              <Star className="w-6 h-6" style={{ color: colors.bg }} fill={colors.bg} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="font-medium leading-tight"
              style={{
                color: '#808080',
                fontSize: '12pt',
                lineHeight: '1.2',
              }}
            >
              {message}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {showContinue && (
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => {
                onContinue?.();
                toast.dismiss(t);
              }}
              className="text-white font-medium px-5 py-2.5 rounded-md transition-colors"
              style={{
                backgroundColor: colors.bg,
                fontSize: '12pt',
              }}
            >
              {continueText}
            </Button>
          </div>
        )}
      </div>
    </div>
  ), {
    duration: showContinue ? Infinity : 4000,
  });
};

