import { MenubarCheckboxItem, MenubarShortcut } from '../../ui/menubar';

import { useHiddenImage } from '~/hooks/use-hidden-image';

export default function HiddenImage() {
  const [isHidden, setIsHidden] = useHiddenImage();

  return (
    <MenubarCheckboxItem checked={isHidden} onCheckedChange={() => setIsHidden(p => !p)}>
      无图模式
      <MenubarShortcut>⌘K</MenubarShortcut>
    </MenubarCheckboxItem>
  );
}
