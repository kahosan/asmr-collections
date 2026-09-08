import type { SourceWork } from '~/types/source';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import { ai } from '~/ai';
import { prisma } from '~/lib/db';
import { dlsite } from '~/provider/dlsite';
import { findwork, formatError, formatMessage, saveCoverImage } from '~/router/utils';

import { clearSimilarCache } from './similar';

export const updateApp = new Hono();

updateApp.put('/update/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await findwork(id))
      return c.json(formatMessage('收藏不存在'), 400);
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }

  let data: SourceWork | null;

  try {
    data = await dlsite.product(id);
  } catch (e) {
    console.error(e);
    if (e instanceof HTTPError)
      return c.json(formatError(e), e.status);

    return c.json(formatError(e), 500);
  }

  if (!data) return c.json(formatMessage('DLsite 不存在此作品'), 404);

  try {
    const coverPath = await saveCoverImage(data.cover, id);
    data.cover = coverPath ?? data.cover;
  } catch (e) {
    console.error('保存 cover 图片失败', e);
  }

  try {
    const work = await updateWork(data, id);

    return c.json(work);
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
})
  .put('/update/embedding/:id', async c => {
    const { id } = c.req.param();

    try {
      if (!await findwork(id))
        return c.json(formatMessage('收藏不存在'), 400);
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }

    let data: SourceWork | null;

    try {
      data = await dlsite.product(id);
    } catch (e) {
      console.error(e);
      if (e instanceof HTTPError)
        return c.json(formatError(e), e.status);

      return c.json(formatError(e), 500);
    }

    if (!data) return c.json(formatMessage('DLsite 不存在此作品'), 404);

    try {
      const embedding = await ai.vectorizePassage(data);
      if (embedding) {
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
        await clearSimilarCache(id);
      }

      return c.json(formatMessage('向量更新成功'));
    } catch (e) {
      console.error(e);
      return c.json(formatError(e, '生成向量失败'), 500);
    }
  });

export function updateWork(data: SourceWork, id: string) {
  return prisma.work.update({
    where: { id },
    data: {
      id: data.id,
      name: data.name,
      cover: data.cover,
      intro: data.intro,
      circle: {
        connectOrCreate: {
          where: { id: data.circle.id },
          create: {
            id: data.circle.id,
            name: data.circle.name
          }
        },
        update: { name: data.circle.name }
      },
      series: data.series?.id
        ? {
          connectOrCreate: {
            where: { id: data.series.id },
            create: {
              id: data.series.id,
              name: data.series.name
            }
          },
          update: { name: data.series.name }
        }
        : { disconnect: true },
      artists: {
        set: [],
        connectOrCreate: data.artists.map(artist => ({
          where: { name: artist.name },
          create: {
            name: artist.name
          }
        }))
      },
      illustrators: {
        set: [],
        connectOrCreate: data.illustrators.map(illustrator => ({
          where: { name: illustrator.name },
          create: {
            name: illustrator.name
          }
        }))
      },
      ageCategory: data.ageCategory,
      genres: {
        set: [],
        connectOrCreate: data.genres.map(genre => ({
          where: { id: genre.id },
          create: {
            id: genre.id,
            name: genre.name
          }
        }))
      },
      price: data.price,
      sales: data.sales,
      wishlistCount: data.wishlistCount,
      rate: data.rate,
      rateCount: data.rateCount,
      reviewCount: data.reviewCount,
      originalId: data.originalId,
      translationInfo: {
        upsert: {
          create: data.translationInfo,
          update: data.translationInfo
        }
      },
      languageEditions: data.languageEditions,
      releaseDate: data.releaseDate
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
