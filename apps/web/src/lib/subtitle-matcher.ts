import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import type { SubtitleInfo } from '~/hooks/use-media-state';

export class SubtitleMatcher {
  constructor(
    private readonly subtitles: SubtitleInfo[][],
    private readonly options?: IFuseOptions<SubtitleInfo>
  ) {}

  find(trackTitle: string, score = 0.4) {
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      ...this.options
    };

    let resultItem: SubtitleInfo | undefined;

    if (this.subtitles.length > 0) {
      for (const subtitleGroup of this.subtitles) {
        const fuse = new Fuse(subtitleGroup, fuseOptions);
        const results = fuse.search(trackTitle);

        const result = results.at(0);

        if (result?.score && result.score < score)
          resultItem = result.item;
      }

      // fallback
      if (!resultItem) {
        const fuse = new Fuse(this.subtitles.flat(), fuseOptions);
        const results = fuse.search(trackTitle);
        resultItem = results.at(0)?.item;
      }
    }

    return resultItem;
  }
}
