import { usePlayerExpand } from '../../hooks/use-player-expand';

export default function PlayerPageActionsAbove() {
  const setExpand = usePlayerExpand()[1];

  return (
    <div className="min-h-2 w-2/3 bg-accent rounded-md" onClick={() => setExpand(p => !p)} />
  );
}
