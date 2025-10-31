import { MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarTrigger } from '~/components/ui/menubar';

import AgeCategory from './age-category';
import GenresFilter from './genres-filter';
import CircleFilter from './circle-filter';
import SeriesFilter from './series-filter';
import ArtistsFilter from './artists-filter';
import IllustratorsFilter from './illustrators-filter';

import { MinusIcon } from 'lucide-react';

import { Activity } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { useIndexGenerateSearch } from '~/hooks/use-generate-search';
import { voiceLibraryOptionsAtom } from '~/hooks/use-setting-options';

export default function FilterMenu() {
  const { search, exclude } = useIndexGenerateSearch('__root__');
  const navigate = useNavigate({ from: '/' });

  const settings = useAtomValue(voiceLibraryOptionsAtom);

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
          <Activity mode={settings.useLocalVoiceLibrary ? 'visible' : 'hidden'}>
            <MenubarCheckboxItem
              checked={search.existsLocal === 'only'}
              onCheckedChange={() => {
                if (!search.existsLocal)
                  navigate({ search: exclude(['keyword', 'page'], { existsLocal: 'only' }) });
                else if (search.existsLocal === 'only')
                  navigate({ search: exclude(['keyword', 'page'], { existsLocal: 'exclude' }) });
                else
                  navigate({ search: exclude(['keyword', 'page', 'existsLocal']) });
              }}
              onSelect={e => e.preventDefault()}
            >
              {search.existsLocal === 'exclude' && (
                <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                  <MinusIcon className="size-4" />
                </span>
              )}
              本地{search.existsLocal === 'exclude' ? '没' : ''}有
            </MenubarCheckboxItem>
          </Activity>
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
