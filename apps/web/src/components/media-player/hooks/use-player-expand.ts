import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const HASH_PLAYER_PAGE = '#player-page';

const playerExpandAtom = atom(window.location.hash === HASH_PLAYER_PAGE);

export function usePlayerExpand() {
  const [expand, setExpand] = useAtom(playerExpandAtom);

  useEffect(() => {
    const handleHashChange = () => {
      setExpand(window.location.hash === HASH_PLAYER_PAGE);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setExpand]);

  const handleSetExpand = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(expand) : value;

    if (newValue === expand) return;

    if (newValue) {
      // eslint-disable-next-line sukka/browser/prefer-location-assign -- hash change
      window.location.hash = 'player-page';
    } else if (window.location.hash === HASH_PLAYER_PAGE) {
      window.history.back();
    }
  };

  return [expand, handleSetExpand] as const;
}
