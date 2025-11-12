import { useSetAtom } from 'jotai';
import { playerExpandAtom } from '../../hooks/use-player-expand';

export default function PlayerPageActionsAbove() {
  const setExpand = useSetAtom(playerExpandAtom);

  return (
    <div className="min-h-2 w-2/3 bg-accent rounded-md" onClick={() => setExpand(p => !p)} />
  );
}
