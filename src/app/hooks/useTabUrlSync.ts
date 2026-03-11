import { useEffect } from 'react';

export const useTabUrlSync = (tab: string, enabled: boolean, userId?: string | null) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const params = new URLSearchParams(globalThis.location.search);
    params.set('view', tab);
    if (tab === 'user-profile' && userId) {
      params.set('userId', userId);
    } else {
      params.delete('userId');
    }
    const nextQuery = params.toString();
    const queryPart = nextQuery ? `?${nextQuery}` : '';
    const nextUrl = `/app${queryPart}${globalThis.location.hash}`;
    globalThis.history.replaceState(null, '', nextUrl);
  }, [enabled, tab, userId]);
};
