import { match } from 'ts-pattern';
import { MenubarCheckboxItem, MenubarShortcut } from '../ui/menubar';

import { useHiddenImage } from '~/hooks/use-hidden-image';
import { DropdownMenuCheckboxItem } from '../ui/dropdown-menu';

interface HiddenImageProps {
  menuType: 'menubar' | 'dropdown'
}

export default function HiddenImage({ menuType }: HiddenImageProps) {
  const [isHidden, setIsHidden] = useHiddenImage();

  return match(menuType)
    .with('menubar', () => (
      <MenubarCheckboxItem checked={isHidden} onCheckedChange={() => setIsHidden(p => !p)}>
        无图模式
        <MenubarShortcut>⌘K</MenubarShortcut>
      </MenubarCheckboxItem>
    ))
    .with('dropdown', () => (
      <DropdownMenuCheckboxItem checked={isHidden} onCheckedChange={() => setIsHidden(p => !p)}>
        无图模式
      </DropdownMenuCheckboxItem>
    ))
    .exhaustive();
}
