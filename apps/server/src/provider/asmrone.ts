import type { ServerWork, Tracks } from '@asmr-collections/shared';

import type { Recommender } from '~/types/provider/asmr-one';

import { HTTPError } from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';
import { processArtists } from '~/router/route/work/info';

// TODO: 热门推荐和用户推荐

export async function fetchAsmroneTracks(id: string, host: string) {
  try {
    return await fetcher<Tracks>(`${host}/api/tracks/${id.replace('RJ', '')}`);
  } catch (e) {
    if (e instanceof HTTPError && e.status === 404)
      throw new HTTPError(e.data?.error || '作品不存在于 asmr.one', 404);

    throw e;
  };
}

export async function fetchAsmroneSimilarWorks(id: string, host: string): Promise<ServerWork[]> {
  try {
    const data = await fetcher<Recommender>(`${host}/api/recommender/item-neighbors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: id.replace('RJ', '')
      })
    });

    const p = data.works.map(async work => ({
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
      artists: await processArtists(work.vas.map(va => va.name)),
      illustrators: [],
      ageCategory: work.age_category_string === 'adult' ? 3 : (work.age_category_string === 'r15' ? 2 : 1) as (1 | 2 | 3),
      genres: work.tags.map(tag => ({ id: tag.id, name: tag.name })),
      price: work.price,
      sales: work.dl_count,
      wishlistCount: 0,
      rate: work.rate_average_2dp,
      rateCount: work.rate_count,
      originalId: work.original_workno,
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

    return await Promise.all(p);
  } catch (e) {
    if (e instanceof HTTPError && e.status === 404)
      throw new HTTPError(e.data?.error || '作品不存在于 asmr.one', e.status);

    throw e;
  };
};
