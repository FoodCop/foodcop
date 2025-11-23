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
   * Show success toast with icon and optional continue button
   */
  success: (message: string, action?: ToastAction) => {
    const key = `success-${message}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message,
      type: 'success',
      title: 'Success',
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
      title: 'Error',
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
      title: 'Info',
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
      title: 'Warning',
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
   * Show navigation hint toast - unified format matching saved toasts
   */
  navigationHint: (message: string, action?: ToastAction, title?: string) => {
    const key = `navigationHint-${message}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message,
      type: 'info',
      title: title || 'Info',
      showContinue: !!action,
      onContinue: action?.onClick,
      continueText: action?.label || 'Continue',
    });
  },

  /**
   * Unified save confirmation toast - use this for all saved items (videos, restaurants, recipes, photos, etc.)
   * Simple format: "SAVED to Plate" with item name and Continue button
   */
  saved: (itemName: string, isDuplicate = false, navigateTo?: () => void) => {
    if (isDuplicate) {
      const key = `saved-duplicate-${itemName}`;
      if (!shouldShowToast(key)) return null;
      
      return gamifiedToast({
        message: `${itemName} is already in your Plate`,
        type: 'info',
        title: 'Info',
      });
    }
    
    const key = `saved-${itemName}`;
    if (!shouldShowToast(key)) return null;
    
    return gamifiedToast({
      message: `${itemName} saved to Plate`,
      type: 'success',
      title: 'Success',
      showContinue: true,
      onContinue: navigateTo || undefined,
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
      title: 'Info',
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

