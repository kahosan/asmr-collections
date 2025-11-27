import { z } from 'zod';

import { stringToOptionalNumberArray } from '../utils';
import { INDEX_DEFAULT_SEARCH_VALUES, ROOT_DEFAULT_SEARCH_VALUES } from './constants';

export const RootBaseSearchSchema = z.object({
  circleId: z.string().optional(),
  seriesId: z.string().optional(),
  keyword: z.string().optional(),
  embedding: z.string().optional(),
  existsLocal: z.enum(['only', 'exclude']).optional(),

  sort: z.string().default(ROOT_DEFAULT_SEARCH_VALUES.sort),
  order: z.enum(['asc', 'desc']).default(ROOT_DEFAULT_SEARCH_VALUES.order),
  filterOp: z.enum(['and', 'or']).default(ROOT_DEFAULT_SEARCH_VALUES.filterOp),

  artistId: z.array(z.number()).optional(),
  genres: z.array(z.number()).optional(),

  age: z.number().optional(),
  multilingual: z.boolean().optional(),
  subtitles: z.boolean().optional(),
  illustratorId: z.number().optional(),
  artistCount: z.number().optional()
});

export const RootSearchQuerySchema = RootBaseSearchSchema.extend({
  artistId: stringToOptionalNumberArray,
  genres: stringToOptionalNumberArray,

  age: z.coerce.number().optional(),
  multilingual: z.coerce.boolean().optional(),
  illustratorId: z.coerce.number().optional(),
  subtitles: z.coerce.boolean().optional(),
  artistCount: z.coerce.number().optional()
});

export const IndexBaseSearchSchema = z.object({
  page: z.number().default(INDEX_DEFAULT_SEARCH_VALUES.page),
  limit: z.number().default(INDEX_DEFAULT_SEARCH_VALUES.limit)
});

export const IndexSearchQuerySchema = RootSearchQuerySchema.extend({
  page: z.coerce.number(),
  limit: z.coerce.number()
});

// 这个仅在前端使用，没有传到后端
export const WorkDetailsBaseSearchSchema = z.object({
  path: z.array(z.string()).optional()
});
