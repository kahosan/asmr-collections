import { Link } from '@tanstack/react-router';

import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import { useState } from 'react';
import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

import type { Data } from '~/types/work';

interface Props {
  genres: Array<Data<number>>
}

export default function GenresPopover({ genres }: Props) {
  const { search, exclude } = useIndexGenerateSearch();

  const [selectedGenres, setSelectedGenres] = useState(search.genres ?? []);

  // 路由更新后，弹出框不受影响啊，只改了 search
  const [forceClose, setForceClose] = useState<number>();

  return (
    <Popover key={forceClose}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="flex-1">查看标签</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-wrap gap-2 mb-2">
          {genres.sort((a, b) => (a.name.length > b.name.length ? 1 : -1)).map(genre => (
            <Toggle
              variant="outline"
              size="sm"
              key={genre.id}
              pressed={selectedGenres.includes(genre.id)}
              onPressedChange={pressed => {
                if (pressed)
                  setSelectedGenres([...selectedGenres, genre.id]);
                else
                  setSelectedGenres(selectedGenres.filter(id => id !== genre.id));
              }}
            >
              <div className="i-carbon-tag p-2" />
              {genre.name}
            </Toggle>
          ))}
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link
            to="/"
            search={exclude(['keyword', 'page'], { genres: selectedGenres })}
            onClick={() => setForceClose(Math.random())}
          >
            筛选
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
