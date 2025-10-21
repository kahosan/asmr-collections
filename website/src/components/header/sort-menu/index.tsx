import { MenubarContent, MenubarGroup, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarTrigger } from '~/components/ui/menubar';

import { useNavigate } from '@tanstack/react-router';
import { useIndexGenerateSearch } from '~/hooks/use-generate-search';
import { useSettingOptions } from '~/hooks/use-setting-options';

const sortOptions = [
  {
    label: '售价',
    value: 'price'
  },
  {
    label: '销量',
    value: 'sales'
  },
  {
    label: '评分',
    value: 'rate'
  },
  {
    label: '评分人数',
    value: 'rateCount'
  },
  {
    label: '收藏人数',
    value: 'wishlistCount'
  },
  {
    label: '评论人数',
    value: 'reviewCount'
  },
  {
    label: '收藏时间',
    value: 'createdAt'
  },
  {
    label: '更新时间',
    value: 'updatedAt'
  },
  {
    label: '发售时间',
    value: 'releaseDate'
  }
];

export default function SortMenu() {
  const { search, exclude } = useIndexGenerateSearch('__root__');
  const navigate = useNavigate({ from: '/' });

  const [options] = useSettingOptions();

  return (
    <MenubarMenu>
      <MenubarTrigger>
        排序
      </MenubarTrigger>
      <MenubarContent align="center">
        <MenubarRadioGroup
          value={search.order}
          onValueChange={value => {
            if (search.order === value) return;
            navigate({ search: exclude(['page'], { order: (value as 'asc' | 'desc') }) });
          }}
        >
          {([{ label: '正序', value: 'asc' }, { label: '倒序', value: 'desc' }]).map(({ label, value }) => (
            <MenubarRadioItem key={value} value={value}>{label}</MenubarRadioItem>
          ))}
        </MenubarRadioGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarRadioGroup
            value={search.sort}
            onValueChange={value => {
              if (search.sort === value) return;
              navigate({ search: exclude(['page'], { sort: value }) });
            }}
          >
            {sortOptions.map(({ label, value }) => (
              <MenubarRadioItem key={value} value={value} onSelect={e => !options.selectedCloseMenu && e.preventDefault()}>{label}</MenubarRadioItem>
            ))}
          </MenubarRadioGroup>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}
