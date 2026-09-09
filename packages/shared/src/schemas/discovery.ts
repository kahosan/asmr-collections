import { z } from 'zod';

import { DEFAULT_DLSITE_RANK_PERIOD, DLsiteRankPeriodSchema } from './dlsite';

export const DiscoveryProviderSchema: z.ZodEnum<{
  asmrone: 'asmrone'
  dlsite: 'dlsite'
}> = z.enum(['dlsite', 'asmrone']);
export const DiscoverySceneSchema: z.ZodEnum<{
  daily: 'daily'
  personal: 'personal'
  hot: 'hot'
  random: 'random'
}> = z.enum(['daily', 'personal', 'hot', 'random']);
export const DiscoveryModeSchema: z.ZodEnum<{
  pure: 'pure'
  smart: 'smart'
}> = z.enum(['pure', 'smart']);

export type DiscoveryProvider = z.output<typeof DiscoveryProviderSchema>;
export type DiscoveryScene = z.output<typeof DiscoverySceneSchema>;
export type DiscoveryMode = z.output<typeof DiscoveryModeSchema>;

/**
 * Playback and storage filters apply to every scene. Daily recommendations
 * and smart random also use diversity rules when selecting works.
 * Arrays contain IDs of the entities that should participate in the rule.
 * An empty array means all entities participate.
 */
export const DiscoveryRulesSchema: z.ZodObject<{
  recentExcludeDays: z.ZodDefault<z.ZodNumber>
  avoidDuplicateCircle: z.ZodDefault<z.ZodBoolean>
  circleIds: z.ZodDefault<z.ZodArray<z.ZodString>>
  avoidDuplicateArtist: z.ZodDefault<z.ZodBoolean>
  artistIds: z.ZodDefault<z.ZodArray<z.ZodNumber>>
  avoidDuplicateSeries: z.ZodDefault<z.ZodBoolean>
  forceGenreSpread: z.ZodDefault<z.ZodBoolean>
  genreIds: z.ZodDefault<z.ZodArray<z.ZodNumber>>
  avoidDuplicateWorkType: z.ZodDefault<z.ZodBoolean>
  avoidDuplicateAgeCategory: z.ZodDefault<z.ZodBoolean>
  storageOnly: z.ZodDefault<z.ZodBoolean>
}> = z.object({
  recentExcludeDays: z.number().int().min(0).max(3650).default(7),

  avoidDuplicateCircle: z.boolean().default(true),
  circleIds: z.array(z.string().min(1)).max(200).default([]),

  avoidDuplicateArtist: z.boolean().default(true),
  artistIds: z.array(z.number().int().positive()).max(200).default([]),

  avoidDuplicateSeries: z.boolean().default(true),

  forceGenreSpread: z.boolean().default(true),
  genreIds: z.array(z.number().int().positive()).max(200).default([]),

  avoidDuplicateWorkType: z.boolean().default(false),
  avoidDuplicateAgeCategory: z.boolean().default(false),

  storageOnly: z.boolean().default(false)
});

export type DiscoveryRulesInput = z.input<typeof DiscoveryRulesSchema>;
export type DiscoveryRules = z.output<typeof DiscoveryRulesSchema>;

export const DEFAULT_DISCOVERY_RULES: DiscoveryRules = DiscoveryRulesSchema.parse({});
export const DEFAULT_DISCOVERY_COUNT = 6;

const RequestBaseSchema: z.ZodObject<{
  count: z.ZodDefault<z.ZodNumber>
  seed: z.ZodOptional<z.ZodString>
  date: z.ZodOptional<z.ZodString>
  excludeIds: z.ZodDefault<z.ZodArray<z.ZodString>>
  rules: z.ZodPrefault<typeof DiscoveryRulesSchema>
}> = z.object({
  count: z.number().int().min(1).max(50).default(DEFAULT_DISCOVERY_COUNT),
  seed: z.string().min(1).max(128).optional(),
  /** The client-local date is used so server timezone does not change a daily list. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  excludeIds: z.array(z.string().min(1)).max(500).default([]),
  rules: DiscoveryRulesSchema.prefault({})
});

/** Both recommendation scenes draw from the library without a provider. */
const LibraryRequestSchema: z.ZodObject<typeof RequestBaseSchema.shape & {
  scene: z.ZodEnum<{ daily: 'daily', personal: 'personal' }>
}, z.core.$strict> = RequestBaseSchema.extend({
  scene: DiscoverySceneSchema.extract(['daily', 'personal'])
}).strict();

const RandomRequestSchema: z.ZodObject<typeof RequestBaseSchema.shape & {
  scene: z.ZodLiteral<'random'>
  mode: z.ZodDefault<typeof DiscoveryModeSchema>
}, z.core.$strict> = RequestBaseSchema.extend({
  scene: z.literal('random'),
  mode: DiscoveryModeSchema.default('smart')
}).strict();

const HotRequestBaseSchema: z.ZodObject<typeof RequestBaseSchema.shape & {
  scene: z.ZodLiteral<'hot'>
}> = RequestBaseSchema.extend({ scene: z.literal('hot') });

/** Only DLsite has a ranking period; ASMR.ONE requires an API address. */
const HotRequestSchema: z.ZodDiscriminatedUnion<[
  z.ZodObject<typeof HotRequestBaseSchema.shape & {
    provider: z.ZodLiteral<'dlsite'>
    period: z.ZodDefault<typeof DLsiteRankPeriodSchema>
  }, z.core.$strict>,
  z.ZodObject<typeof HotRequestBaseSchema.shape & {
    provider: z.ZodLiteral<'asmrone'>
    api: z.ZodURL
  }, z.core.$strict>
], 'provider'> = z.discriminatedUnion('provider', [
  HotRequestBaseSchema.extend({
    provider: z.literal('dlsite'),
    period: DLsiteRankPeriodSchema.default(DEFAULT_DLSITE_RANK_PERIOD)
  }).strict(),
  HotRequestBaseSchema.extend({ provider: z.literal('asmrone'), api: z.url() }).strict()
]);

export const DiscoveryRequestSchema: z.ZodDiscriminatedUnion<[
  typeof LibraryRequestSchema,
  typeof RandomRequestSchema,
  typeof HotRequestSchema
], 'scene'> = z.discriminatedUnion('scene', [LibraryRequestSchema, RandomRequestSchema, HotRequestSchema]);

/** Callers may omit defaults; the engine receives only the parsed request. */
export type DiscoveryRequestInput = z.input<typeof DiscoveryRequestSchema>;
export type DiscoveryRequest = z.output<typeof DiscoveryRequestSchema>;
