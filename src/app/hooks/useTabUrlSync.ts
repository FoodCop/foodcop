import { useEffect } from 'react';

export const useTabUrlSync = (tab: string, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const params = new URLSearchParams(globalThis.location.search);
    params.set('view', tab);
    const nextQuery = params.toString();
    const queryPart = nextQuery ? `?${nextQuery}` : '';
    const nextUrl = `/app${queryPart}${globalThis.location.hash}`;
    globalThis.history.replaceState(null, '', nextUrl);
  }, [enabled, tab]);
};
