import { z } from 'zod';

export const DiscoverySourceSchema: z.ZodEnum<{
  personal: 'personal'
  asmrone: 'asmrone'
}> = z.enum(['personal', 'asmrone']);
export const DiscoveryHotProviderSchema: z.ZodEnum<{
  personal: 'personal'
  asmrone: 'asmrone'
  dlsite: 'dlsite'
}> = z.enum(['dlsite', 'asmrone', 'personal']);
export const DiscoverySceneSchema: z.ZodEnum<{
  daily: 'daily'
  hot: 'hot'
  random: 'random'
}> = z.enum(['daily', 'hot', 'random']);
export const DiscoveryModeSchema: z.ZodEnum<{
  pure: 'pure'
  smart: 'smart'
}> = z.enum(['pure', 'smart']);

export type DiscoverySource = z.output<typeof DiscoverySourceSchema>;
export type DiscoveryHotProvider = z.output<typeof DiscoveryHotProviderSchema>;
export type DiscoveryScene = z.output<typeof DiscoverySceneSchema>;
export type DiscoveryMode = z.output<typeof DiscoveryModeSchema>;

/**
 * Rules shared by the daily recommendation and smart-random experiences.
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
export type DiscoveryRulesOutput = z.output<typeof DiscoveryRulesSchema>;
export type DiscoveryRules = DiscoveryRulesOutput;

export const DiscoveryRequestSchema: z.ZodObject<{
  scene: z.ZodEnum<{
    daily: 'daily'
    hot: 'hot'
    random: 'random'
  }>
  source: z.ZodOptional<z.ZodEnum<{
    personal: 'personal'
    asmrone: 'asmrone'
  }>>
  provider: z.ZodOptional<z.ZodEnum<{
    personal: 'personal'
    asmrone: 'asmrone'
    dlsite: 'dlsite'
  }>>
  api: z.ZodOptional<z.ZodURL>
  mode: z.ZodDefault<z.ZodEnum<{
    pure: 'pure'
    smart: 'smart'
  }>>
  count: z.ZodDefault<z.ZodNumber>
  seed: z.ZodOptional<z.ZodString>
  date: z.ZodOptional<z.ZodString>
  excludeIds: z.ZodDefault<z.ZodArray<z.ZodString>>
  rules: z.ZodDefault<z.ZodObject<{
    recentExcludeDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>
    avoidDuplicateCircle: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    circleIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>
    avoidDuplicateArtist: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    artistIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNumber>>>
    avoidDuplicateSeries: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    forceGenreSpread: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    genreIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNumber>>>
    avoidDuplicateWorkType: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    avoidDuplicateAgeCategory: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
    storageOnly: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
  }>>
}> = z.object({
  scene: DiscoverySceneSchema,
  source: DiscoverySourceSchema.optional(),
  provider: DiscoveryHotProviderSchema.optional(),
  api: z.url().optional(),
  mode: DiscoveryModeSchema.default('smart'),
  count: z.number().int().min(1).max(50).default(6),
  seed: z.string().min(1).max(128).optional(),
  /** The client-local date is used so server timezone does not change a daily list. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  excludeIds: z.array(z.string().min(1)).max(500).default([]),
  rules: DiscoveryRulesSchema.partial().default({})
});

export type DiscoveryRequest = z.input<typeof DiscoveryRequestSchema>;
