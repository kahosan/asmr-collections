import { z } from 'zod';

import { stringToOptionalNumberArray } from '../utils';
import { INDEX_DEFAULT_SEARCH_VALUES, ROOT_DEFAULT_SEARCH_VALUES } from './constants';

export const RootBaseSearchSchema: z.ZodObject<{
  circleId: z.ZodOptional<z.ZodString>
  seriesId: z.ZodOptional<z.ZodString>
  keyword: z.ZodOptional<z.ZodString>
  embedding: z.ZodOptional<z.ZodString>
  storageFilter: z.ZodOptional<z.ZodEnum<{
    only: 'only'
    exclude: 'exclude'
  }>>
  sort: z.ZodDefault<z.ZodString>
  order: z.ZodDefault<z.ZodEnum<{
    desc: 'desc'
    asc: 'asc'
  }>>
  filterOp: z.ZodDefault<z.ZodEnum<{
    and: 'and'
    or: 'or'
  }>>
  artistId: z.ZodOptional<z.ZodArray<z.ZodNumber>>
  genres: z.ZodOptional<z.ZodArray<z.ZodNumber>>
  age: z.ZodOptional<z.ZodNumber>
  multilingual: z.ZodOptional<z.ZodBoolean>
  subtitles: z.ZodOptional<z.ZodBoolean>
  illustratorId: z.ZodOptional<z.ZodNumber>
  artistCount: z.ZodOptional<z.ZodNumber>
}> = z.object({
  circleId: z.string().optional(),
  seriesId: z.string().optional(),
  keyword: z.string().optional(),
  embedding: z.string().optional(),
  storageFilter: z.enum(['only', 'exclude']).optional(),

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

export const RootSearchQuerySchema: z.ZodObject<{
  circleId: z.ZodOptional<z.ZodString>
  seriesId: z.ZodOptional<z.ZodString>
  keyword: z.ZodOptional<z.ZodString>
  embedding: z.ZodOptional<z.ZodString>
  storageFilter: z.ZodOptional<z.ZodEnum<{
    only: 'only'
    exclude: 'exclude'
  }>>
  sort: z.ZodDefault<z.ZodString>
  order: z.ZodDefault<z.ZodEnum<{
    desc: 'desc'
    asc: 'asc'
  }>>
  filterOp: z.ZodDefault<z.ZodEnum<{
    and: 'and'
    or: 'or'
  }>>
  artistId: z.ZodPipe<z.ZodTransform, z.ZodOptional<z.ZodArray<z.ZodCoercedNumber>>>
  genres: z.ZodPipe<z.ZodTransform, z.ZodOptional<z.ZodArray<z.ZodCoercedNumber>>>
  age: z.ZodOptional<z.ZodCoercedNumber>
  multilingual: z.ZodOptional<z.ZodCoercedBoolean>
  illustratorId: z.ZodOptional<z.ZodCoercedNumber>
  subtitles: z.ZodOptional<z.ZodCoercedBoolean>
  artistCount: z.ZodOptional<z.ZodCoercedNumber>
}> = RootBaseSearchSchema.extend({
  artistId: stringToOptionalNumberArray,
  genres: stringToOptionalNumberArray,

  age: z.coerce.number().optional(),
  multilingual: z.coerce.boolean().optional(),
  illustratorId: z.coerce.number().optional(),
  subtitles: z.coerce.boolean().optional(),
  artistCount: z.coerce.number().optional()
});

export const IndexBaseSearchSchema: z.ZodObject<{
  page: z.ZodDefault<z.ZodNumber>
  limit: z.ZodDefault<z.ZodNumber>
}> = z.object({
  page: z.number().default(INDEX_DEFAULT_SEARCH_VALUES.page),
  limit: z.number().default(INDEX_DEFAULT_SEARCH_VALUES.limit)
});

export const IndexSearchQuerySchema: z.ZodObject<{
  circleId: z.ZodOptional<z.ZodString>
  seriesId: z.ZodOptional<z.ZodString>
  keyword: z.ZodOptional<z.ZodString>
  embedding: z.ZodOptional<z.ZodString>
  storageFilter: z.ZodOptional<z.ZodEnum<{
    only: 'only'
    exclude: 'exclude'
  }>>
  sort: z.ZodDefault<z.ZodString>
  order: z.ZodDefault<z.ZodEnum<{
    desc: 'desc'
    asc: 'asc'
  }>>
  filterOp: z.ZodDefault<z.ZodEnum<{
    and: 'and'
    or: 'or'
  }>>
  artistId: z.ZodPipe<z.ZodTransform, z.ZodOptional<z.ZodArray<z.ZodCoercedNumber>>>
  genres: z.ZodPipe<z.ZodTransform, z.ZodOptional<z.ZodArray<z.ZodCoercedNumber>>>
  age: z.ZodOptional<z.ZodCoercedNumber>
  multilingual: z.ZodOptional<z.ZodCoercedBoolean>
  illustratorId: z.ZodOptional<z.ZodCoercedNumber>
  subtitles: z.ZodOptional<z.ZodCoercedBoolean>
  artistCount: z.ZodOptional<z.ZodCoercedNumber>
  page: z.ZodCoercedNumber
  limit: z.ZodCoercedNumber
}> = RootSearchQuerySchema.extend({
  page: z.coerce.number(),
  limit: z.coerce.number()
});

// 这个仅在前端使用，没有传到后端
export const WorkDetailsBaseSearchSchema: z.ZodObject<{
  path: z.ZodOptional<z.ZodArray<z.ZodString>>
}> = z.object({
  path: z.array(z.string()).optional()
});
