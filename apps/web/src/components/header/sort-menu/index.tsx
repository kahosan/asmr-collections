import { MenubarContent, MenubarGroup, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarTrigger } from '~/components/ui/menubar';

import { useNavigate } from '@tanstack/react-router';
import { useGenerateSearch } from '~/hooks/use-generate-search';

import { setStoredValue } from '~/providers/router/utils';

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
  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

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
            const newValue = value as 'asc' | 'desc';
            navigate({ to: '/', search: exclude(['page', 'keyword'], { order: newValue }) });
            setStoredValue('__sort-options__', { order: newValue, sortBy: search.sort });
          }}
        >
          {([{ label: '正序', value: 'asc' }, { label: '倒序', value: 'desc' }]).map(({ label, value }) => (
            <MenubarRadioItem
              key={value}
              value={value}
              onSelect={e => e.preventDefault()}
            >
              {label}
            </MenubarRadioItem>
          ))}
        </MenubarRadioGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarRadioGroup
            value={search.sort}
            onValueChange={value => {
              if (search.sort === value) return;
              navigate({ to: '/', search: exclude(['page', 'keyword'], { sort: value }) });
              setStoredValue('__sort-options__', { order: search.order, sortBy: value });
            }}
          >
            {sortOptions.map(({ label, value }) => (
              <MenubarRadioItem key={value} value={value} onSelect={e => e.preventDefault()}>{label}</MenubarRadioItem>
            ))}
          </MenubarRadioGroup>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}
