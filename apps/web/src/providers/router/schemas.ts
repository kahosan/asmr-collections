import { z } from 'zod';

import { IndexBaseSearchSchema, RootBaseSearchSchema, WorkDetailsBaseSearchSchema } from '@asmr-collections/shared';

import { getStoredValue } from './utils';
import { ROOT_DEFAULT_SEARCH_VALUES } from '@asmr-collections/shared';

export const RootSearchSchema = RootBaseSearchSchema.extend({
  order: z.enum(['asc', 'desc'])
    .default(() => getStoredValue('__sort-options__')?.order ?? ROOT_DEFAULT_SEARCH_VALUES.order),
  sort: z.string()
    .default(() => getStoredValue('__sort-options__')?.sortBy ?? ROOT_DEFAULT_SEARCH_VALUES.sort)
});

export const IndexSearchSchema = IndexBaseSearchSchema;

export const WorkDetailsSearchSchema = WorkDetailsBaseSearchSchema;
