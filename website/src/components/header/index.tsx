import { Link } from '@tanstack/react-router';

import { Menubar } from '../ui/menubar';
import { Separator } from '../ui/separator';

import SearchBar from './search-bar';

import SortMenu from './sort-menu';
import OtherMenu from './other-menu';
import FilterMenu from './filter-menu';

import { useIsRoute } from '~/hooks/use-is-route';
import { WorkDetailsMenu } from './work-details-menu';

export default function Header() {
  const isIndexPage = useIsRoute('/');
  const isDetailsPage = useIsRoute('/work-details/$id');

  return (
    <div className="fixed top-0 w-[calc(100%-var(--removed-body-scroll-bar-size,0px))] z-10 bg-background">
      <div className="max-w-7xl  mx-auto flex justify-between items-center h-14 p-4">
        <Link className="font-bold text-lg" to="/" search={{ order: 'desc', sort: 'releaseDate', filterOp: 'and' }}>ASMR</Link>
        <div className="flex items-center">
          <SearchBar />

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
  );
}
