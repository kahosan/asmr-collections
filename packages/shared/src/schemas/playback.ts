import type { Track, Tracks } from '../types';

import * as z from 'zod';

import { TrackSchema, TracksSchema } from './track';

export type PlaybackUpsert = z.infer<typeof PlaybackUpsertSchema>;
export const PlaybackUpsertSchema: z.ZodObject<{
  track: z.ZodType<Track, unknown, z.core.$ZodTypeInternals<Track>>
  tracks: z.ZodOptional<z.ZodType<Tracks, unknown, z.core.$ZodTypeInternals<Tracks>>>
  position: z.ZodOptional<z.ZodNumber>
  incrementCount: z.ZodOptional<z.ZodBoolean>
}> = z.object({
  track: TrackSchema,
  tracks: TracksSchema.optional(),
  position: z.number().optional(),
  incrementCount: z.boolean().optional()
});
