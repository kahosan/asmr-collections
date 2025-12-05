import { Button } from '~/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '~/components/ui/drawer';

import WorkPreview from '../work-preview';

import { useState } from 'react';

export default function AuditionDrawer({ workId, originalId }: { workId: string, originalId?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg">试听</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>试听</DrawerTitle>
          <DrawerDescription>试听DLsite作品音频</DrawerDescription>
        </DrawerHeader>
        {open && <WorkPreview workId={workId} originalId={originalId} className="min-h-64" />}
      </DrawerContent>
    </Drawer>
  );
}
