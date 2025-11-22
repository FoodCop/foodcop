import { toast } from 'sonner';

/**
 * Enhanced toast helpers with consistent styling and actions
 */

interface ToastAction {
  label: string;
  onClick: () => void;
}

export const toastHelpers = {
  /**
   * Show success toast with optional action
   */
  success: (message: string, action?: ToastAction) => {
    return toast.success(message, {
      description: 'Great! Your action was completed successfully.',
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 4000,
    });
  },

  /**
   * Show error toast with optional action
   */
  error: (message: string, action?: ToastAction) => {
    return toast.error(message, {
      description: 'Something went wrong. Please try again.',
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 5000,
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show loading toast (returns dismiss function)
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Show navigation hint toast
   */
  navigationHint: (message: string, action?: ToastAction) => {
    return toast.info(message, {
      description: 'Tap to explore this feature',
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 5000,
      icon: '💡',
    });
  },

  /**
   * Show save confirmation toast
   */
  saved: (itemName: string, isDuplicate = false) => {
    if (isDuplicate) {
      return toast.info('Already saved', {
        description: `${itemName} is already in your Plate`,
        duration: 3000,
      });
    }
    return toast.success('Saved to Plate!', {
      description: `${itemName} has been added to your collection`,
      action: {
        label: 'View Plate',
        onClick: () => {
          window.location.href = '/plate';
        },
      },
      duration: 4000,
    });
  },

  /**
   * Show feature coming soon toast
   */
  comingSoon: (feature: string) => {
    return toast.info('Coming Soon', {
      description: `${feature} will be available in a future update`,
      duration: 3000,
    });
  },
};

