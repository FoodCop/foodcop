import { useEffect } from 'react';
import type { UseKeyboardNavProps } from '../types';

export const useKeyboardNav = ({ onClose, onNavigate, isOpen }: UseKeyboardNavProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          if (onNavigate) {
            event.preventDefault();
            onNavigate('prev');
          }
          break;
        case 'ArrowRight':
          if (onNavigate) {
            event.preventDefault();
            onNavigate('next');
          }
          break;
        default:
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNavigate]);
};