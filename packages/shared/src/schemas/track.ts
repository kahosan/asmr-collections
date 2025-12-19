import type { SubtitleInfo, Track, Tracks } from '../types';

import * as z from 'zod';

export const SubtitleInfoSchema: z.ZodType<SubtitleInfo> = z.object({
  title: z.string(),
  url: z.string().optional(),
  content: z.string().optional(),
  type: z.enum(['vtt', 'srt'])
});

export const TrackSchema: z.ZodType<Track> = z.lazy(() => z.object({
  type: z.enum(['folder', 'audio', 'image', 'text', 'other']),
  hash: z.string().optional(),
  title: z.string(),
  children: z.array(TrackSchema).optional(),
  work: z.object({
    id: z.number(),
    source_id: z.string(),
    source_type: z.string()
  }).optional(),
  workTitle: z.string().optional(),
  mediaStreamUrl: z.string().optional(),
  mediaDownloadUrl: z.string().optional(),
  streamLowQualityUrl: z.string().optional(),
  duration: z.number().optional(),
  subtitles: SubtitleInfoSchema.optional(),
  position: z.number().optional()
}));

export const TracksSchema: z.ZodType<Tracks> = z.array(TrackSchema);
