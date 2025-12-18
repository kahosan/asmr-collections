import * as z from 'zod';

export type PlaybackUpsert = z.infer<typeof PlaybackUpsertSchema>;
export const PlaybackUpsertSchema: z.ZodObject<{
  track: z.ZodAny
  tracks: z.ZodOptional<z.ZodArray<z.ZodAny>>
  position: z.ZodOptional<z.ZodNumber>
  incrementCount: z.ZodOptional<z.ZodBoolean>
}> = z.object({
  track: z.any(),
  tracks: z.array(z.any()).optional(),
  position: z.number().optional(),
  incrementCount: z.boolean().optional()
});
