import { useSyncExternalStore, useMemo } from 'react';

export function useIsMobile() {
  const query = '(max-width: 639.9px)';

  const subscribe = useMemo(() => (callback: () => void) => {
    const mql = window.matchMedia(query);

    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, []);

  const getSnapshot = () => window.matchMedia(query).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
