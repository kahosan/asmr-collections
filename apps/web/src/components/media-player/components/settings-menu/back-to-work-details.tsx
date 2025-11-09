import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';
import { playerExpandAtom } from '../../hooks/use-player-expand';

export default function BackToWorkDetails() {
  const mediaState = useAtomValue(mediaStateAtom);
  const setPlayerExpand = useSetAtom(playerExpandAtom);
  const workId = mediaState.work?.id ?? '';

  const navigate = useNavigate();
  const handleClick = () => {
    if (workId) {
      navigate({
        to: '/work-details/$id',
        params: { id: workId }
      });
      setPlayerExpand(false);
    }
  };
  return (
    <div onClick={handleClick} className="w-full cursor-pointer">
      回到作品页
    </div>
  );
}
