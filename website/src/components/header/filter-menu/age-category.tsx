import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import { useNavigate } from '@tanstack/react-router';
import { useIndexGenerateSearch } from '~/hooks/use-generate-search';
import { useSettingOptions } from '~/hooks/use-setting-options';

export default function AgeCategory() {
  const { search, exclude } = useIndexGenerateSearch();
  const navigate = useNavigate({ from: '/' });

  const [options] = useSettingOptions();

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        年龄分级
      </MenubarSubTrigger>
      <MenubarSubContent>
        {[{ label: '全年龄', value: 1 }, { label: 'R15', value: 2 }, { label: 'R18', value: 3 }]
          .map(({ label, value }) => (
            <MenubarCheckboxItem
              key={value}
              checked={search.age === value}
              onCheckedChange={checked => {
                if (checked)
                  navigate({ search: exclude(['page', 'keyword'], { age: value }) });
                else
                  navigate({ search: exclude(['page', 'keyword', 'age']) });
              }}
              onSelect={e => !options.selectedCloseMenu && e.preventDefault()}
            >
              {label}
            </MenubarCheckboxItem>
          ))}
      </MenubarSubContent>
    </MenubarSub>
  );
}
