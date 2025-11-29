import { useRef, useCallback } from 'react';

export function usePreventAutoFocus<E extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<E>(null);

  const onOpenAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    ref.current?.focus({ preventScroll: true });
  }, []);

  return { ref, onOpenAutoFocus, tabIndex: -1 as const };
}
