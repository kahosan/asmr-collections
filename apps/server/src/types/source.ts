import type { Data, ServerWork } from '@asmr-collections/shared';

export type SourceWork = Omit<
  ServerWork,
  | 'createdAt'
  | 'updatedAt'
  | 'playback'
  | 'subtitles'
  | 'subtitlesData'
  | 'artists'
  | 'illustrators'
> & {
  artists: Array<Data<string>>
  illustrators: Array<Data<string>>
};
