import { useAtomValue } from 'jotai';
import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { cn } from '~/lib/utils';

export default function PlayerCover() {
  const mediaState = useAtomValue(mediaStateAtom);
  const isHiddenImage = useAtomValue(hiddenImageAtom);

  const data = mediaState.work;

  return (
    <div className="w-full relative max-w-[60%] h-auto flex items-center self-center max-sm:self-auto max-sm:max-w-full">
      <div className="pb-[85%]" />
      <div className="bg-zinc-700 absolute inset-0 overflow-hidden rounded-md">
        <img
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
