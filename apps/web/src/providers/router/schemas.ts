import { z } from 'zod';

import { getStoredValue } from './utils';
import { ROOT_DEFAULT_SEARCH_VALUES } from './constants';

export const RootSearchSchema = z.object({
  circleId: z.string().optional(),
  seriesId: z.string().optional(),
  illustratorId: z.number().optional(),
  artistId: z.array(z.number()).optional(),
  artistCount: z.number().optional(),
  genres: z.array(z.number()).optional(),
  keyword: z.string().optional(),
  embedding: z.string().optional(),
  multilingual: z.boolean().optional(),
  age: z.number().optional(),
  subtitles: z.boolean().optional(),
  existsLocal: z.enum(['only', 'exclude']).optional(),

  order: z.enum(['asc', 'desc'])
    .default(() => getStoredValue('__sort-options__')?.order ?? ROOT_DEFAULT_SEARCH_VALUES.order),
  sort: z.string()
    .default(() => getStoredValue('__sort-options__')?.sortBy ?? ROOT_DEFAULT_SEARCH_VALUES.sort),
  filterOp: z.enum(['and', 'or'])
    .default(ROOT_DEFAULT_SEARCH_VALUES.filterOp)
});

export const IndexSearchSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional()
});

export const WorkDetailsSearchSchema = z.object({
  path: z.array(z.string()).optional()
});
