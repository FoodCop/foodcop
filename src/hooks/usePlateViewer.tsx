import { useUniversalViewer } from '../contexts/UniversalViewerContext';

/**
 * Legacy hook kept for backward compatibility.
 * New code should import useUniversalViewer directly.
 */
export function usePlateViewer() {
  return useUniversalViewer();
}