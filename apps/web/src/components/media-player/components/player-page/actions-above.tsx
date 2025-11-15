import { useSetAtom } from 'jotai';
import { playerExpandAtom } from '../../hooks/use-player-expand';

export default function PlayerPageActionsAbove() {
  const setExpand = useSetAtom(playerExpandAtom);

  const handleClick = () => setExpand(p => !p);

  return (
    <div className="sm:mt-4 min-h-1.5 cursor-pointer bg-[#967a7480] hover:bg-[#967a74cc] w-26 max-sm:w-2/3 mx-auto relative transition-colors duration-300 rounded-md" onClick={handleClick}>
      <div className="absolute -left-12.5 -right-12.5 -top-2.5 -bottom-2.5" />
    </div>
  );
}
