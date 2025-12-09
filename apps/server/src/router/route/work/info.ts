import type { ServerWork, WorkInfoResponse } from '@asmr-collections/shared';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { formatError } from '~/router/utils';
import { createCachified, ttl } from '~/lib/cachified';

const [dlsiteCache, clearDLsiteCache] = createCachified<WorkInfoResponse<ServerWork> | null>({
  ttl: ttl.day(1)
});

export const infoApp = new Hono();

export async function processArtists(names: string[]) {
  if (!names.length)
    return [];

  const prisma = getPrisma();

  const existing = await prisma.artist.findMany({
    where: { name: { in: names } }
  });

  const existingNames = new Set(existing.map(a => a.name));
  const newNames = names.filter(name => !existingNames.has(name));

  if (newNames.length > 0) {
    await prisma.artist.createMany({
      data: newNames.map(name => ({ name })),
      skipDuplicates: true
    });

    return prisma.artist.findMany({
      where: { name: { in: names } }
    });
  }

  return existing;
}

export async function processIllustrators(names: string[]) {
  if (!names.length)
    return [];

  const prisma = getPrisma();

  const existing = await prisma.illustrator.findMany({
    where: { name: { in: names } }
  });

  const existingNames = new Set(existing.map(i => i.name));
  const newNames = names.filter(name => !existingNames.has(name));

  if (newNames.length > 0) {
    await prisma.illustrator.createMany({
      data: newNames.map(name => ({ name })),
      skipDuplicates: true
    });

    return prisma.illustrator.findMany({
      where: { name: { in: names } }
    });
  }

  return existing;
}

infoApp.get('/info/:id', async c => {
  const { id } = c.req.param();

  try {
    const data = await dlsiteCache({
      cacheKey: `dlsite-work-info-${id}`,
      getFreshValue: () => getInfo(id),
      ctx: c
    });

    if (!data) {
      await clearDLsiteCache(`dlsite-work-info-${id}`);
      return c.json({ message: 'DLsite 不存在此作品' }, 404);
    }

    return c.json(data);
  } catch (e) {
    if (e instanceof HTTPError)
      return c.json(formatError(`获取作品信息失败，返回 Code：${e.status}`), 500);

    return c.json(formatError('获取作品信息失败'), 500);
  }
});

async function getInfo(id: string): Promise<WorkInfoResponse<ServerWork> | null> {
  const data = await fetchWorkInfo(id);

  if (!data)
    return null;

  const [artists, illustrators] = await Promise.all([
    processArtists(data.artists ?? []),
    processIllustrators(data.illustrators ?? [])
  ]);

  return {
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
    subtitles: false,
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
}
