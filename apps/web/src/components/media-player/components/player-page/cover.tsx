import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { cn } from '~/lib/utils';
import { playerExpandAtom } from '../../hooks/use-player-expand';

export default function PlayerCover({ ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const mediaState = useAtomValue(mediaStateAtom);
  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const setPlayerExpand = useSetAtom(playerExpandAtom);

  const navigate = useNavigate();
  const location = useLocation();

  const data = mediaState.work;

  const handleClick = () => {
    if (data?.id) {
      if (location.pathname !== `/work-details/${data.id}`) {
        navigate({
          to: '/work-details/$id',
          params: { id: data.id },
          ignoreBlocker: true
        });
      }
      setPlayerExpand(false);
    }
  };

  return (
    <div {...rest} className="w-full relative max-w-[60%] h-auto flex items-center self-center max-sm:self-auto max-sm:max-w-full">
      <div className="pb-[75%]" />
      <div className="bg-zinc-700 absolute inset-0 overflow-hidden rounded-md">
        <img
          onClick={handleClick}
          src={data?.cover}
          alt={data?.name}
          onLoad={e => { e.currentTarget.style.opacity = '1'; }}
          className={cn(
            'object-cover object-center size-full opacity-0 transition-opacity',
            isHiddenImage && 'filter blur-xl'
          )}
        />
      </div>
    </div>
  );
}
