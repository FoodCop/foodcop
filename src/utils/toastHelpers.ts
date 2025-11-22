import { toast } from 'sonner';
import { gamifiedToast } from '../components/ui/gamified-toast';

/**
 * Enhanced toast helpers with gamified styling and bright colors
 * All notifications only trigger once per unique message within a cooldown period
 */

interface ToastAction {
  label: string;
  onClick: () => void;
}

// Track recent toast calls to prevent duplicates
const recentToasts = new Map<string, number>();
const TOAST_COOLDOWN = 3000; // 3 seconds

const shouldShowToast = (key: string): boolean => {
  const now = Date.now();
  const lastShown = recentToasts.get(key);
  
  if (lastShown && (now - lastShown) < TOAST_COOLDOWN) {
    return false; // Too soon, don't show
  }
  
  recentToasts.set(key, now);
  
  // Clean up old entries
  for (const [k, timestamp] of recentToasts.entries()) {
    if (now - timestamp > TOAST_COOLDOWN * 2) {
      recentToasts.delete(k);
    }
  }
  
  return true;
};

export const toastHelpers = {
  /**
   * Show success toast with star and optional continue button
   */
  success: (message: string, action?: ToastAction) => {
    const key = `success-${message}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message,
      type: 'success',
      showStar: true,
      showContinue: !!action,
      onContinue: action?.onClick,
      continueText: action?.label || 'Continue',
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, action?: ToastAction) => {
    const key = `error-${message}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message,
      type: 'error',
      showContinue: !!action,
      onContinue: action?.onClick,
      continueText: action?.label || 'Continue',
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, description?: string) => {
    const fullMessage = description ? `${message}\n${description}` : message;
    const key = `info-${fullMessage}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message: fullMessage,
      type: 'info',
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, description?: string) => {
    const fullMessage = description ? `${message}\n${description}` : message;
    const key = `warning-${fullMessage}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message: fullMessage,
      type: 'warning',
    });
  },

  /**
   * Show loading toast (returns dismiss function)
   */
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-center',
    });
  },

  /**
   * Show navigation hint toast
   */
  navigationHint: (message: string, action?: ToastAction) => {
    const key = `navigationHint-${message}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message,
      type: 'info',
      showContinue: !!action,
      onContinue: action?.onClick,
      continueText: action?.label || 'Explore',
    });
  },

  /**
   * Show save confirmation toast with star and continue button
   */
  saved: (itemName: string, isDuplicate = false, navigateTo?: () => void) => {
    if (isDuplicate) {
      const key = `saved-duplicate-${itemName}`;
      if (!shouldShowToast(key)) return null;
      
      return gamifiedToast({
        message: `${itemName} is already in your Plate`,
        type: 'info',
      });
    }
    
    const key = `saved-${itemName}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message: `Your ${itemName} has been saved to Plate`,
      type: 'success',
      showStar: true,
      showContinue: true,
      onContinue: navigateTo || (() => {
        window.location.href = '/plate';
      }),
      continueText: 'Continue',
    });
  },

  /**
   * Show feature coming soon toast
   */
  comingSoon: (feature: string) => {
    const key = `comingSoon-${feature}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message: `${feature} will be available in a future update`,
      type: 'info',
    });
  },

  /**
   * Show confirmation dialog pattern: "Save XYZ? Continue. Discard."
   * Returns a promise that resolves with true if confirmed, false if discarded
   */
  confirm: (message: string, itemName?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // This will be handled by the confirmation dialog component
      // For now, use a simple confirm dialog
      const confirmed = window.confirm(itemName ? `${message} ${itemName}?` : `${message}?`);
      resolve(confirmed);
    });
  },
};

