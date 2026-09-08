import type { ServerWork, Tracks } from '@asmr-collections/shared';

import type { PopularWorks } from '~/types/popular';
import type { Recommender, Tags } from '~/types/provider/asmr-one';

import { HTTPError } from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';

interface PopularResponse {
  works: Array<{
    source_id: string
    mainCoverUrl: string
    title: string
    circle: {
      source_id: string
      name: string
    }
    tags: Array<{ id: number, name: string }>
  }>
}

export class ASMROneProvider {
  readonly #host: string;

  constructor(host: string) {
    this.#host = host;
  }

  async popular(limit = 100): Promise<PopularWorks> {
    const data = await fetcher<PopularResponse>(`${this.#host}/api/recommender/popular`, {
      method: 'POST',
      body: JSON.stringify({ pageSize: limit })
    });

    return data.works.map((w, i) => ({
      id: w.source_id,
      rank: i + 1,
      cover: w.mainCoverUrl,
      name: w.title,
      intro: undefined,
      circle: {
        id: w.circle.source_id,
        name: w.circle.name
      },
      genres: w.tags.map(tag => ({
        id: tag.id,
        name: tag.name
      }))
    }));
  }

  async tracks(id: string) {
    try {
      return await fetcher<Tracks>(`${this.#host}/api/tracks/${id.replace('RJ', '')}`);
    } catch (e) {
      if (e instanceof HTTPError && e.status === 404)
        throw new HTTPError(e.data?.detail || '作品不存在于 asmr.one', 404);

      throw e;
    };
  }

  tags() {
    return fetcher<Tags>(`${this.#host}/api/tags/`);
  }

  async similar(id: string): Promise<ServerWork[]> {
    try {
      const data = await fetcher<Recommender>(`${this.#host}/api/recommender/item-neighbors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: id.replace('RJ', '')
        })
      });

      return data.works.map<ServerWork>(work => ({
        id: work.source_id,
        name: work.title,
        cover: work.mainCoverUrl,
        intro: work.title,
        circleId: work.circle.source_id,
        circle: {
          id: work.circle.source_id,
          name: work.circle.name
        },
        seriesId: null,
        series: null,
        artists: work.vas.map(va => ({ name: va.name, source: 'asmrone', sourceId: va.id })),
        illustrators: [],
        ageCategory: work.age_category_string === 'adult' ? 3 : (work.age_category_string === 'r15' ? 2 : 1),
        genres: work.tags.map(tag => ({ id: tag.id, name: tag.name })),
        price: work.price,
        sales: work.dl_count,
        wishlistCount: 0,
        rate: work.rate_average_2dp,
        rateCount: work.rate_count,
        originalId: work.original_workno,
        playback: null,
        reviewCount: work.review_count,
        releaseDate: new Date(work.release),
        translationInfo: {
          isVolunteer: work.translation_info.is_volunteer,
          isOriginal: work.translation_info.is_original,
          isParent: work.translation_info.is_parent,
          isChild: work.translation_info.is_child,
          isTranslationBonusChild: work.translation_info.is_translation_bonus_child,
          originalWorkno: work.translation_info.original_workno,
          parentWorkno: work.translation_info.parent_workno,
          childWorknos: work.translation_info.child_worknos,
          lang: work.translation_info.lang
        },
        createdAt: new Date(work.create_date),
        updatedAt: new Date(work.create_date),
        languageEditions: Array.isArray(work.language_editions)
          ? work.language_editions.map(edition => ({
            workId: edition.workno,
            label: edition.label,
            lang: edition.lang
          }))
          : [],
        subtitles: false
      }));
    } catch (e) {
      if (e instanceof HTTPError && e.status === 404)
        throw new HTTPError(e.data?.detail || '作品不存在于 asmr.one', e.status);

      throw e;
    };
  }
}
