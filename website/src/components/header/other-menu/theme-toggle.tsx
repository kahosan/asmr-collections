import { useTheme } from 'next-themes';
import { MenubarRadioGroup, MenubarRadioItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

const themeToText = {
  light: '亮色模式',
  dark: '暗色模式',
  system: '跟随系统'
} as const;

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        主题切换
      </MenubarSubTrigger>
      <MenubarSubContent>
        <MenubarRadioGroup
          value={theme}
          onValueChange={setTheme}
        >
          {(['light', 'dark', 'system'] as const)
            .map(_theme => (
              <MenubarRadioItem
                key={_theme}
                value={_theme}
              >
                {themeToText[_theme]}
              </MenubarRadioItem>
            ))}
        </MenubarRadioGroup>
      </MenubarSubContent>
    </MenubarSub>
  );
}
