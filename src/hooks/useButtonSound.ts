import useSound from 'use-sound';

/**
 * Custom hook for button click sounds
 * Place your sound files in the /public/sounds/ folder
 */
export const useButtonSound = (soundFile: string = '/sounds/click.mp3', options?: Record<string, unknown>) => {
  const [play] = useSound(soundFile, {
    volume: 0.5,
    ...options
  });
  
  return play;
};

/**
 * Pre-configured button sound hooks for common interactions
 */
export const useClickSound = () => useButtonSound('/sounds/click.mp3', { volume: 0.3 });
export const useSuccessSound = () => useButtonSound('/sounds/success.mp3', { volume: 0.4 });
export const useErrorSound = () => useButtonSound('/sounds/error.mp3', { volume: 0.4 });
export const useHoverSound = () => useButtonSound('/sounds/hover.mp3', { volume: 0.2 });
export const useSwipeSound = () => useButtonSound('/sounds/swipe.mp3', { volume: 0.3 });
