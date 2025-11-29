import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import { useNavigate } from '@tanstack/react-router';
import { useGenerateSearch } from '~/hooks/use-generate-search';

import { cn } from '~/lib/utils';

const AGE_OPTIONS = [
  { label: '全年龄', value: 1 },
  { label: 'R15', value: 2 },
  { label: 'R18', value: 3 }
] as const;

export default function AgeCategory() {
  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const getCheckedState = (id: number) => {
    if (search.age === id) return true;
    if (search.age === -id) return 'indeterminate';
    return false;
  };

  const handleSelect = (id: number) => {
    if (search.age === id) {
      // 当前是“选中” -> 切换为“排除/不确定” (负数)
      navigate({ to: '/', search: exclude(['page', 'keyword'], { age: -id }) });
    } else if (search.age === -id) {
      // 当前是“排除/不确定” -> 切换为“未选中” (移除字段)
      navigate({ to: '/', search: exclude(['page', 'keyword', 'age']) });
    } else {
      // 当前是“未选中”或其他 -> 切换为“选中” (正数)
      navigate({ to: '/', search: exclude(['page', 'keyword'], { age: id }) });
    }
  };

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.age ? 'opacity-100' : 'opacity-60')}>
        年龄分级
      </MenubarSubTrigger>
      <MenubarSubContent>
        {AGE_OPTIONS
          .map(({ label, value }) => (
            <MenubarCheckboxItem
              key={value}
              checked={getCheckedState(value)}
              onCheckedChange={() => handleSelect(value)}
              onSelect={e => e.preventDefault()}
            >
              {label}
            </MenubarCheckboxItem>
          ))}
      </MenubarSubContent>
    </MenubarSub>
  );
}
