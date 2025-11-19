import type { WorkInfo } from '~/types/source';

import { Hono } from 'hono';
import { getPrisma } from '~/lib/db';

import { fetchWorkInfo } from '~/lib/dlsite';
import { HTTPError } from '~/lib/fetcher';
import { formatError, generateEmbedding, workIsExistsInDB } from '~/router/utils';

export const createApp = new Hono();

createApp.post('/create/:id', async c => {
  const { id } = c.req.param();

  let data: WorkInfo | null;
  let embedding: number[] | undefined;

  try {
    data = await fetchWorkInfo(id);
  } catch (e) {
    console.error(e);
    return c.json(formatError('获取作品信息失败'), 500);
  }

  if (!data) return c.json({ message: 'DLsite 不存在此作品' }, 404);

  try {
    if (await workIsExistsInDB(id))
      return c.json({ message: '作品已收藏' }, 400);
  } catch (e) {
    return c.json(formatError(e), 500);
  }

  let embeddingError: HTTPError | null = null;
  try {
    embedding = await generateEmbedding(data);
  } catch (e) {
    if (e instanceof HTTPError)
      embeddingError = e;
    else if (e instanceof Error)
      embeddingError = new HTTPError(e.message, 500);

    console.error(`${id} 生成向量失败:`, e);
  }

  const prisma = getPrisma();

  try {
    const work = await createWork(data, id);

    if (embedding) {
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${work.id}`;
    }

    return c.json({
      data: work,
      message: embeddingError ? `Jina API 生成向量失败: ${embeddingError.data?.detail ?? embeddingError.message}` : undefined
    });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

export function createWork(data: WorkInfo, id: string) {
  const prisma = getPrisma();

  return prisma.work.create({
    data: {
      id,
      name: data.name,
      cover: data.image_main,
      intro: data.intro,
      circle: {
        connectOrCreate: {
          where: { id: data.maker.id },
          create: {
            id: data.maker.id,
            name: data.maker.name
          }
        }
      },
      series: data.series?.id
        ? {
          connectOrCreate: {
            where: { id: data.series.id },
            create: {
              id: data.series.id,
              name: data.series.name
            }
          }
        }
        : undefined,
      artists: {
        connectOrCreate: data.artists?.map(artist => ({
          where: { name: artist },
          create: {
            name: artist
          }
        }))
      },
      illustrators: {
        connectOrCreate: data.illustrators?.map(illustrator => ({
          where: { name: illustrator },
          create: {
            name: illustrator
          }
        }))
      },
      ageCategory: data.age_category,
      genres: {
        connectOrCreate: data.genres?.map(genre => ({
          where: { id: genre.id },
          create: {
            id: genre.id,
            name: genre.name
          }
        }))
      },
      price: data.price ?? 0,
      sales: data.sales ?? 0,
      wishlistCount: data.wishlist_count ?? 0,
      rate: data.rating ?? 0,
      rateCount: data.rating_count ?? 0,
      originalId: data.translation_info.original_workno,
      reviewCount: data.review_count ?? 0,
      translationInfo: {
        create: {
          isVolunteer: data.translation_info.is_volunteer,
          isOriginal: data.translation_info.is_original,
          isParent: data.translation_info.is_parent,
          isChild: data.translation_info.is_child,
          isTranslationBonusChild: data.translation_info.is_translation_bonus_child,
          originalWorkno: data.translation_info.original_workno,
          parentWorkno: data.translation_info.parent_workno,
          childWorknos: data.translation_info.child_worknos,
          lang: data.translation_info.lang
        }
      },
      languageEditions: data.language_editions?.map(l => ({
        workId: l.work_id,
        label: l.label,
        lang: l.lang
      })),
      releaseDate: data.release_date
    },
    include: {
      circle: true,
      series: true,
      artists: true,
      illustrators: true,
      genres: true,
      translationInfo: true
    }
  });
}
