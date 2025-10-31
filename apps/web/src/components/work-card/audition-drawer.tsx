import { Button } from '~/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger
} from '~/components/ui/drawer';

import useSWR from 'swr';
import { useState } from 'react';
import fetchp from 'fetch-jsonp';

async function fetcher<T>(key: string) {
  return fetchp(key, { referrerPolicy: 'no-referrer-when-downgrade' }).then(res => res.json() as Promise<T>);
}

interface Embed {
  works: Array<{ embed_url: string, embed_width: number, embed_height: number }>
}

export default function AuditionDrawer({ workId, originalId }: { workId: string, originalId?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSWR<Embed>(
    open ? `https://chobit.cc/api/v1/dlsite/embed?workno=${originalId ?? workId}&callback=onloadChobitCallback` : null,
    fetcher
  );

  const embed = data?.works.at(0);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg">试听</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full flex justify-center mt-4">
          {
            isLoading
              ? <div className="flex justify-center items-center h-32">Loading...</div>
              : <iframe title="embed preview player" src={embed?.embed_url} width={embed?.embed_width} height={embed?.embed_height} allowFullScreen sandbox="allow-popups allow-scripts" />
          }
        </div>
      </DrawerContent>
    </Drawer>
  );
}
