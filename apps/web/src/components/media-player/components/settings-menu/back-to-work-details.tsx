import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';
import { usePlayerExpand } from '../../hooks/use-player-expand';

export default function BackToWorkDetails() {
  const mediaState = useAtomValue(mediaStateAtom);
  const setPlayerExpand = usePlayerExpand()[1];
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
