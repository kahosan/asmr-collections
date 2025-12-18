import * as z from 'zod';

export type PlaybackUpsert = z.infer<typeof PlaybackUpsertSchema>;
export const PlaybackUpsertSchema: z.ZodObject<{
  track: z.ZodAny
  position: z.ZodOptional<z.ZodNumber>
  incrementCount: z.ZodOptional<z.ZodBoolean>
}> = z.object({
  track: z.any(),
  position: z.number().optional(),
  incrementCount: z.boolean().optional()
});
