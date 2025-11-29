import { Link, useSearch } from '@tanstack/react-router';

import { Menubar } from '../ui/menubar';
import { Separator } from '../ui/separator';

import SearchBar from './search-bar';

import SortMenu from './sort-menu';
import OtherMenu from './other-menu';
import FilterMenu from './filter-menu';
import { WorkDetailsMenu } from './work-details-menu';

import SettingsDialog from './settings';

import { useAtom, useSetAtom } from 'jotai';

import { useIsRoute } from '~/hooks/use-is-route';
import { useShortcut } from '~/hooks/use-shortcut';
import { hiddenImageAtom } from '~/hooks/use-hidden-image';

import { showSettingDialogAtom } from '~/lib/store';

export default function Header() {
  const isIndexPage = useIsRoute('/');
  const isDetailsPage = useIsRoute('/work-details/$id');

  const search = useSearch({ from: '__root__' });

  const setHiddenImage = useSetAtom(hiddenImageAtom);
  useShortcut('k', () => setHiddenImage(p => !p));

  const [showSettingsDialog, setShowSettingsDialog] = useAtom(showSettingDialogAtom);
  useShortcut(',', () => setShowSettingsDialog(p => !p));

  return (
    <>
      <div className="fixed top-0 w-full z-10 bg-background">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-(--navbar-height) p-4 gap-2">
          <Link className="font-bold text-lg" to="/" search={{ order: 'desc', sort: 'releaseDate', filterOp: 'and' }}>ASMR</Link>
          <div className="flex items-center gap-2">
            <SearchBar search={search} key={search.keyword} />

            {
              isIndexPage
                ? (
                  <Menubar className="min-w-max">
                    <FilterMenu />
                    <SortMenu />
                    <OtherMenu />
                  </Menubar>
                )
                : null
            }

            {
              isDetailsPage
                ? <WorkDetailsMenu />
                : null
            }

          </div>
        </div>
        <Separator />
      </div>
      <SettingsDialog open={showSettingsDialog} setOpen={setShowSettingsDialog} />
    </>
  );
}
