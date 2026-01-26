import { toast } from 'sonner';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GamifiedToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  showContinue?: boolean;
  onContinue?: () => void;
  continueText?: string;
  showSecondary?: boolean;
  onSecondary?: () => void;
  secondaryText?: string;
  position?: 'center' | 'top-center' | 'bottom-center';
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
    bg: '#FFC909', // Yellow
    text: '#111827',
    border: '#E6B508',
    icon: 'fa-triangle-exclamation',
    defaultTitle: 'Warning',
  },
  info: {
    bg: '#FFC909', // Yellow
    text: '#111827',
    border: '#E6B508',
    icon: 'fa-circle-info',
    defaultTitle: 'Info',
  },
};

export const gamifiedToast = (options: GamifiedToastOptions) => {
  const {
    message,
    type,
    title,
    showContinue = false,
    onContinue,
    continueText = 'Continue',
    showSecondary = false,
    onSecondary,
    secondaryText = "Don't Show Again",
    position = 'top-center'
  } = options;
  const colors = colorMap[type];
  const displayTitle = title || colors.defaultTitle;
  const isCenter = position === 'center';

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

  return toast.custom((t) => {
    // For center toasts, use portal to render outside Sonner's container
    if (isCenter) {
      const CenterToast = () => {
        useEffect(() => {
          return () => {
            // Cleanup handled by Sonner
          };
        }, []);

        return createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => toast.dismiss(t)}
              style={{
                animation: 'fadeIn 0.2s ease-out',
              }}
            />

            {/* Toast Container */}
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-[90%] z-[9999] rounded-xl shadow-lg p-4 sm:p-6 pointer-events-auto border-2"
              style={{
                backgroundColor: type === 'error' ? colors.bg : '#FFFFFF',
                borderColor: type === 'error' ? colors.border : '#EEE',
                fontSize: '12pt',
                animation: 'toastCenterIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center flex-1 min-w-0">
                  {/* Logo - no background, as-is */}
                  <div
                    className="w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0 p-2"
                  >
                    <img
                      src={type === 'error' ? "/logo_white.png" : "/logo_mobile.png"}
                      alt="FUZO"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Title and Message */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-1" style={{ color: type === 'error' ? colors.text : '#374151' }}>
                      {displayTitle}
                    </h3>
                    <p className="text-sm" style={{ color: type === 'error' ? colors.text : '#808080' }}>
                      {message}
                    </p>
                  </div>
                </div>

                {/* Action Button - Continue or Close */}
                <div className="flex gap-2 flex-shrink-0 items-center justify-end sm:ml-4">
                  {showSecondary && (
                    <button
                      onClick={() => {
                        onSecondary?.();
                        toast.dismiss(t);
                      }}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-xs transition-all"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {secondaryText}
                    </button>
                  )}

                  {showContinue ? (
                    <button
                      onClick={() => {
                        onContinue?.();
                        toast.dismiss(t);
                      }}
                      className="px-5 py-2 text-white rounded-lg font-medium text-sm transition-all hover:bg-[#EA580C]"
                      style={{
                        backgroundColor: '#FFC909',
                        fontFamily: "'Roboto', sans-serif",
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {continueText}
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.dismiss(t)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <i className="fa-solid fa-xmark text-lg" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        );
      };

      return <CenterToast />;
    }

    // Regular toast (non-center) - rendered normally by Sonner
    return (
      <div className="relative">
        {/* Toast Container */}
        <div
          className="rounded-xl shadow-lg p-4 sm:p-6 pointer-events-auto border-2 w-full max-w-[90vw] sm:w-96"
          style={{
            backgroundColor: type === 'error' ? colors.bg : '#FFFFFF',
            borderColor: type === 'error' ? colors.border : '#EEE',
            fontSize: '12pt',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center flex-1 min-w-0">
              {/* Logo - no background, as-is */}
              <div
                className="w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0 p-2"
              >
                <img
                  src={type === 'error' ? "/logo_white.png" : "/logo_mobile.png"}
                  alt="FUZO"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Title and Message */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-1" style={{ color: type === 'error' ? colors.text : '#374151' }}>
                  {displayTitle}
                </h3>
                <p className="text-sm" style={{ color: type === 'error' ? colors.text : '#808080' }}>
                  {message}
                </p>
              </div>
            </div>

            {/* Action Button - Continue or Close */}
            <div className="flex gap-2 flex-shrink-0 items-center justify-end sm:ml-4">
              {showSecondary && (
                <button
                  onClick={() => {
                    onSecondary?.();
                    toast.dismiss(t);
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-xs transition-all"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    whiteSpace: 'nowrap'
                  }}
                >
                  {secondaryText}
                </button>
              )}

              {showContinue ? (
                <button
                  onClick={() => {
                    onContinue?.();
                    toast.dismiss(t);
                  }}
                  className="px-5 py-2 text-white rounded-lg font-medium text-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: colors.bg,
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {continueText}
                </button>
              ) : (
                <button
                  onClick={() => toast.dismiss(t)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark text-lg" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, {
    duration: showContinue ? Infinity : 4000,
    position: isCenter ? undefined : position, // Let Sonner handle non-center positions
  });
};
