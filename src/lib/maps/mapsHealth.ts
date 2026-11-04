'use client';

import { useSyncExternalStore } from 'react';
import { MAPS_FAILED_EVENT } from './mapsHealthScript';

const subscribe = (notify: () => void) => {
  window.addEventListener(MAPS_FAILED_EVENT, notify);
  return () => window.removeEventListener(MAPS_FAILED_EVENT, notify);
};
const read = () => (window as unknown as { __fzMapsFailed?: boolean }).__fzMapsFailed === true;

/** True once Google has refused to load maps on this page. */
export const useMapsFailed = () => useSyncExternalStore(subscribe, read, () => false);
