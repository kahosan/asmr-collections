import { Link } from '@tanstack/react-router';

import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import { CheckIcon, MinusIcon, Tag } from 'lucide-react';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Data } from '@asmr-collections/shared';

interface Props {
  genres: Array<Data<number>>
  searchGenres?: number[]
}

export default function GenresPopover({ genres, searchGenres }: Props) {
  const [selectedGenres, setSelectedGenres] = useState(searchGenres ?? []);

  // 路由更新后，弹出框不受影响啊，只改了 search
  const [forceClose, setForceClose] = useState<number>();

  const handleSelect = (id: number) => {
    setSelectedGenres(p => {
      const currentList = p;
      const isSelected = currentList.includes(id);
      const isExcluded = currentList.includes(-id);

      if (isSelected) {
        // 当前是“选中” -> 切换为“排除” (移除正数，添加负数)
        return currentList.filter(x => x !== id).concat(-id);
      }

      if (isExcluded) {
        // 当前是“排除” -> 切换为“未选中” (移除负数)
        return currentList.filter(x => x !== -id);
      }

      // 当前是“未选中” -> 切换为“选中” (添加正数)
      return [...currentList, id];
    });
  };

  const genresSorted = useMemo(() => {
    return genres.sort((a, b) => (a.name.length > b.name.length ? 1 : -1));
  }, [genres]);

  const isActive = (id: number) => {
    if (selectedGenres.includes(id)) return true;
    if (selectedGenres.includes(-id)) return 'indeterminate';
    return false;
  };

  return (
    <Popover key={forceClose}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="flex-1">查看标签</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-wrap gap-2 mb-2">
          {genresSorted.map(genre => {
            const isActiveState = isActive(genre.id);
            return (
              <Toggle
                variant="outline"
                size="sm"
                key={genre.id}
                pressed={!!isActiveState}
                onPressedChange={() => handleSelect(genre.id)}
              >
                <Tag />
                {genre.name}
                <AnimatePresence>
                  {isActiveState && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.1, ease: 'easeInOut' }}
                    >
                      {isActiveState === 'indeterminate'
                        ? <MinusIcon />
                        : <CheckIcon />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Toggle>
            );
          })}
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link
            to="/"
            search={prev => ({ ...prev, genres: selectedGenres, page: undefined, keyword: undefined })}
            onClick={() => setForceClose(Math.random())}
          >
            筛选
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
