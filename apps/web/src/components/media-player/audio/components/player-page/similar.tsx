import { Link } from '~/components/link';
import { Image } from '~/components/image';

import { Button } from '~/components/ui/button';
import { Item, ItemContent, ItemGroup, ItemHeader, ItemTitle } from '~/components/ui/item';

import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { useSimilar } from '~/hooks/use-similar';
import { mediaStateAtom } from '~/hooks/use-media-state';

const workAtom = focusAtom(mediaStateAtom, optic => optic.prop('work'));

export function Similar() {
  // 打开播放器时一定存在
  const { id } = useAtomValue(workAtom)!;

  const { data } = useSimilar(id, true);

  return (
    <ItemGroup className="mt-4">
      {data?.map(item => (
        <Item key={item.id} variant="outline" className="p-0 gap-2">
          <ItemHeader>
            <Image
              src={item.cover}
              alt={item.name}
              classNames={{ wrapper: 'pb-[75%] rounded-t-sm' }}
            />
          </ItemHeader>
          <ItemContent className="gap-4 p-2">
            <ItemTitle className="break-all">
              {item.name}
            </ItemTitle>
            <Button variant="secondary" asChild>
              <Link to="/work-details/$id" params={{ id: item.id }}>详情</Link>
            </Button>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
