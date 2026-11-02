import { Image } from '~/components/image';
import { Badge } from '~/components/ui/badge';

import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';

import { mediaStateAtom } from '~/hooks/use-media-state';

import { useMedia } from '../../context/media';
import { playerExpandAtom } from '../../hooks/use-player-expand';

export function PlayerCover({ ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const mediaState = useAtomValue(mediaStateAtom);
  const setPlayerExpand = useSetAtom(playerExpandAtom);

  const { isTranscoded } = useMedia();

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
    <div {...rest} className="w-full relative h-auto flex items-center self-center max-sm:self-auto max-sm:max-w-full max-sm:mt-12">
      <div className="pb-[75%]" />
      <Image
        onClick={handleClick}
        src={data?.cover}
        alt={data?.name}
        classNames={{
          wrapper: 'bg-zinc-700 absolute inset-0 overflow-hidden rounded-md',
          img: 'cursor-pointer'
        }}
      />
      {isTranscoded && <Badge className="absolute bottom-2 right-2" size="sm" variant="warning">AAC</Badge>}
    </div>
  );
}
