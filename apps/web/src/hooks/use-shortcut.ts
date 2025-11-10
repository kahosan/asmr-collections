import { useEffect } from 'react';

export function useShortcut(shortcut: string, callback: () => void, single = false) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === shortcut && (e.metaKey || e.ctrlKey || single)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', down);

    return () => document.removeEventListener('keydown', down);
  }, [callback, shortcut, single]);
}
