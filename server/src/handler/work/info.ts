import type { WorkInfoResp } from '~/types/collection';
import { Hono } from 'hono';
import prisma from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { HTTPError } from '~/lib/fetcher';

export const infoApp = new Hono();

async function processArtists(names: string[]) {
  if (!names.length)
    return [];

  const records = await prisma.artist.findMany({
    where: { name: { in: names } }
  });

  const recordMap = new Map(
    records.map(record => [record.name, record])
  );

  return names.map(name => {
    const record = recordMap.get(name);
    return record
      ? { name: record.name, id: record.id }
      : { name, id: null };
  });
}

async function processIllustrators(names: string[]) {
  if (!names.length)
    return [];

  const records = await prisma.illustrator.findMany({
    where: { name: { in: names } }
  });

  const recordMap = new Map(
    records.map(record => [record.name, record])
  );

  return names.map(name => {
    const record = recordMap.get(name);
    return record
      ? { name: record.name, id: record.id }
      : { name, id: null };
  });
}

infoApp.get('/info/:id', async c => {
  const { id } = c.req.param();

  try {
    const data = await fetchWorkInfo(id);

    if (!data)
      return c.json({ message: 'DLsite 不存在此作品' }, 404);

    const [artists, illustrators] = await Promise.all([
      processArtists(data.artists ?? []),
      processIllustrators(data.illustrators ?? [])
    ]);

    const work: WorkInfoResp = {
      id: data.id,
      name: data.name,
      cover: data.image_main,
      intro: data.intro,
      circleId: data.maker.id,
      circle: data.maker,
      seriesId: data.series?.id ?? null,
      series: data.series ?? null,
      artists,
      illustrators,
      ageCategory: data.age_category,
      genres: data.genres ?? [],
      price: data.price ?? 0,
      sales: data.sales ?? 0,
      wishlistCount: data.wishlist_count ?? 0,
      rate: data.rating ?? 0,
      rateCount: data.rating_count ?? 0,
      originalId: data.translation_info.original_workno,
      reviewCount: data.review_count ?? 0,
      releaseDate: data.release_date,
      translationInfo: {
        isVolunteer: data.translation_info.is_volunteer,
        isOriginal: data.translation_info.is_original,
        isParent: data.translation_info.is_parent,
        isChild: data.translation_info.is_child,
        isTranslationBonusChild: data.translation_info.is_translation_bonus_child,
        originalWorkno: data.translation_info.original_workno,
        parentWorkno: data.translation_info.parent_workno,
        childWorknos: data.translation_info.child_worknos,
        lang: data.translation_info.lang
      },
      languageEditions: data.language_editions?.map(item => ({
        workId: item.work_id,
        label: item.label,
        lang: item.lang
      })) ?? []
    };

    return c.json(work);
  } catch (e) {
    if (e instanceof HTTPError)
      return c.json({ message: `获取作品信息失败，返回 Code：${e.status}` }, 500);

    return c.json({ message: '获取作品信息失败' }, 500);
  }
});
