import * as z from 'zod';

import { HTTPError } from '../lib/fetcher';

const NonEmptyStringSchema = z.string().min(1);
const DateStringSchema = NonEmptyStringSchema.refine(
  value => !Number.isNaN(new Date(value).getTime()),
  { message: 'Invalid date' }
);

const AgeCategorySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3)
]);

const TranslationInfoSchema = z.object({
  is_volunteer: z.boolean(),
  is_original: z.boolean(),
  is_parent: z.boolean(),
  is_child: z.boolean(),
  is_translation_bonus_child: z.boolean(),
  original_workno: z.string().nullable(),
  parent_workno: z.string().nullable(),
  child_worknos: z.array(z.string()),
  lang: z.string().nullable()
});

const RatingCountDetailSchema = z.object({
  review_point: z.number(),
  count: z.number().int().nonnegative(),
  ratio: z.number().nonnegative()
});

const LanguageEditionSchema = z.object({
  workno: NonEmptyStringSchema,
  display_label: NonEmptyStringSchema,
  lang: NonEmptyStringSchema
});

const CreatorSchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema
});

const GenreSchema = z.object({
  id: z.number().int().nonnegative(),
  name: NonEmptyStringSchema,
  name_base: z.string().optional()
});

/**
 * Fields consumed from DLsite's product detail endpoint. Unknown keys are
 * intentionally stripped so unrelated upstream additions do not break us.
 */
export const DLsiteProductDetailSchema: z.ZodType<{
  workno: string
  maker_id: string
  maker_name: string
  intro_s?: string | null
  creaters?: {
    voice_by?: Array<{ id: string, name: string }>
    illust_by?: Array<{ id: string, name: string }>
  } | [] | null
  genres: Array<{
    id: number
    name: string
    name_base?: string
  }>
}> = z.object({
  workno: NonEmptyStringSchema,
  maker_id: NonEmptyStringSchema,
  maker_name: NonEmptyStringSchema,
  intro_s: z.string().nullish(),
  creaters: z.union([
    z.object({
      voice_by: z.array(CreatorSchema).optional(),
      illust_by: z.array(CreatorSchema).optional()
    }),
    z.tuple([])
  ]).nullish(),
  genres: z.array(GenreSchema)
});

/** Fields consumed from DLsite's legacy product statistics endpoint. */
export const DLsiteProductStatsSchema: z.ZodType<{
  work_name: string
  work_image: string
  title_id?: string | null
  title_name?: string | null
  age_category: 1 | 2 | 3
  price?: number | null
  dl_count?: number | null
  wishlist_count?: number | null
  review_count?: number | null
  regist_date: string
  rate_average_2dp?: number | null
  rate_count?: number | null
  rate_count_detail?: Array<{
    review_point: number
    count: number
    ratio: number
  }> | null
  translation_info: {
    is_volunteer: boolean
    is_original: boolean
    is_parent: boolean
    is_child: boolean
    is_translation_bonus_child: boolean
    original_workno: string | null
    parent_workno: string | null
    child_worknos: string[]
    lang: string | null
  }
  dl_count_items?: Array<{
    workno: string
    display_label: string
    lang: string
  }> | null
}> = z.object({
  work_name: NonEmptyStringSchema,
  work_image: NonEmptyStringSchema,
  title_id: z.string().nullish(),
  title_name: z.string().nullish(),
  age_category: AgeCategorySchema,
  price: z.number().int().nonnegative().nullish(),
  dl_count: z.number().int().nonnegative().nullish(),
  wishlist_count: z.number().int().nonnegative().nullish(),
  review_count: z.number().int().nonnegative().nullish(),
  regist_date: DateStringSchema,
  rate_average_2dp: z.number().min(0).max(5).nullish(),
  rate_count: z.number().int().nonnegative().nullish(),
  rate_count_detail: z.array(RatingCountDetailSchema).nullish(),
  translation_info: TranslationInfoSchema,
  dl_count_items: z.array(LanguageEditionSchema).nullish()
});

const DLsiteProductDetailResponseSchema = z.array(DLsiteProductDetailSchema);
const DLsiteProductStatsResponseSchema = z.union([
  z.array(z.unknown()).max(0),
  z.record(z.string(), z.unknown())
]);
export const DLsiteProductHTMLSchema: z.ZodType<{
  circle: { id: string, name: string }
  artists: Array<{ id: string, name: string }>
  illustrators: Array<{ id: string, name: string }>
  intro: string
  genres: Array<{ id: number, name: string }>
}> = z.object({
  circle: z.object({
    id: NonEmptyStringSchema,
    name: NonEmptyStringSchema
  }),
  artists: z.array(CreatorSchema),
  illustrators: z.array(CreatorSchema),
  intro: z.string(),
  genres: z.array(GenreSchema.omit({ name_base: true }))
});

export type DLsiteProductDetail = z.infer<typeof DLsiteProductDetailSchema>;
export type DLsiteProductStats = z.infer<typeof DLsiteProductStatsSchema>;
export type DLsiteProductHTML = z.infer<typeof DLsiteProductHTMLSchema>;

function formatIssues(error: z.ZodError) {
  return error.issues
    .map(issue => `${issue.path.map(String).join('.') || 'response'}: ${issue.message}`)
    .join('; ');
}

function responseError(endpoint: string, id: string, detail: string) {
  return new HTTPError('DLsite 响应格式发生变化', 502, {
    detail: `${endpoint} (${id}): ${detail}`
  });
}

export function parseDLsiteProductDetailResponse(input: unknown, id: string): DLsiteProductDetail | null {
  const result = DLsiteProductDetailResponseSchema.safeParse(input);
  if (!result.success)
    throw responseError('商品详情接口', id, formatIssues(result.error));

  if (result.data.length === 0)
    return null;

  const product = result.data.find(item => item.workno.toUpperCase() === id.toUpperCase());
  if (!product)
    throw responseError('商品详情接口', id, '返回内容不包含请求的作品');

  return product;
}

export function parseDLsiteProductStatsResponse(input: unknown, id: string): DLsiteProductStats | null {
  const response = DLsiteProductStatsResponseSchema.safeParse(input);
  if (!response.success)
    throw responseError('商品统计接口', id, formatIssues(response.error));

  if (Array.isArray(response.data))
    return null;

  const value = response.data[id] ?? response.data[id.toUpperCase()];
  if (value === undefined)
    throw responseError('商品统计接口', id, '返回内容不包含请求的作品');

  const product = DLsiteProductStatsSchema.safeParse(value);
  if (!product.success)
    throw responseError('商品统计接口', id, formatIssues(product.error));

  return product.data;
}

export function parseDLsiteProductHTMLResponse(input: unknown, id: string): DLsiteProductHTML {
  const result = DLsiteProductHTMLSchema.safeParse(input);
  if (!result.success)
    throw responseError('商品详情页面', id, formatIssues(result.error));

  return result.data;
}

export const DLsiteRankPeriodSchema: z.ZodEnum<{
  day: 'day'
  month: 'month'
  total: 'total'
  week: 'week'
}> = z.enum(['day', 'week', 'month', 'total']);

export type DLsiteRankPeriod = z.infer<typeof DLsiteRankPeriodSchema>;

export const DEFAULT_DLSITE_RANK_PERIOD: DLsiteRankPeriod = 'day';
