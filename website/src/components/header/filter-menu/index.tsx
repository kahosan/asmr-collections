import { MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarTrigger } from '~/components/ui/menubar';

import AgeCategory from './age-category';
import GenresFilter from './genres-filter';
import CircleFilter from './circle-filter';
import SeriesFilter from './series-filter';
import ArtistsFilter from './artists-filter';
import IllustratorsFilter from './illustrators-filter';

import { useNavigate } from '@tanstack/react-router';
import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

export default function FilterMenu() {
  const { search, exclude } = useIndexGenerateSearch('__root__');
  const navigate = useNavigate({ from: '/' });

  return (
    <MenubarMenu>
      <MenubarTrigger>
        筛选
      </MenubarTrigger>
      <MenubarContent>
        <MenubarGroup>
          <AgeCategory />
          <MenubarShortcut />
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={search.multilingual}
            onCheckedChange={checked => {
              if (checked)
                navigate({ search: exclude(['keyword', 'page'], { multilingual: true }) });
              else
                navigate({ search: exclude(['keyword', 'page', 'multilingual']) });
            }}
            onSelect={e => e.preventDefault()}
          >
            多语言
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={search.subtitles}
            onCheckedChange={checked => {
              if (checked)
                navigate({ search: exclude(['keyword', 'page'], { subtitles: true }) });
              else
                navigate({ search: exclude(['keyword', 'page', 'subtitles']) });
            }}
            onSelect={e => e.preventDefault()}
          >
            带字幕
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarRadioGroup
            value={search.filterOp}
            onValueChange={value => {
              if (search.filterOp === value) return;
              navigate({ search: exclude(['keyword', 'page'], { filterOp: value as 'and' | 'or' }) });
            }}
          >
            <MenubarRadioItem value="and" onSelect={e => e.preventDefault()}>
              与
            </MenubarRadioItem>
            <MenubarRadioItem value="or" onSelect={e => e.preventDefault()}>
              或
            </MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSeparator />
          <ArtistsFilter />
          <IllustratorsFilter />
          <GenresFilter />
          <CircleFilter />
          <SeriesFilter />
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}
