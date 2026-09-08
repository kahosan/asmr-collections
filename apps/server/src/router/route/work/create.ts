import type { SourceWork } from '~/types/source';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import { ai } from '~/ai';
import { prisma } from '~/lib/db';
import { dlsite } from '~/provider/dlsite';
import { findwork, formatError, formatMessage, saveCoverImage } from '~/router/utils';

import { clearSimilarCache } from './similar';

export const createApp = new Hono();

createApp.post('/create/:id', async c => {
  const { id } = c.req.param();

  let data: SourceWork | null;
  let embedding: number[] | undefined;

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
    if (await findwork(id))
      return c.json(formatMessage('作品已收藏'), 400);
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }

  const warnings: string[] = [];
  try {
    embedding = await ai.vectorizePassage(data);
  } catch (e) {
    const error = formatError(e);
    warnings.push(`向量生成失败：${error.data?.detail ?? error.message}`);
    console.error(`${id} 生成向量失败`, e);
  }

  try {
    const coverPath = await saveCoverImage(data.cover, id);
    data.cover = coverPath ?? data.cover;
  } catch (e) {
    console.error('保存 cover 图片失败', e);
    warnings.push(`封面保存失败：${formatError(e).message}`);
  }

  try {
    const work = await createWork(data, id);

    if (embedding) {
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${work.id}`;
      await clearSimilarCache(id);
    }

    return c.json({ message: warnings.join('\n') || undefined, data: work });
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
});

export function createWork(data: SourceWork, id: string) {
  return prisma.work.create({
    data: {
      id,
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
        connectOrCreate: data.artists.map(artist => ({
          where: { name: artist.name },
          create: {
            name: artist.name
          }
        }))
      },
      illustrators: {
        connectOrCreate: data.illustrators.map(illustrator => ({
          where: { name: illustrator.name },
          create: {
            name: illustrator.name
          }
        }))
      },
      ageCategory: data.ageCategory,
      genres: {
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
      originalId: data.originalId,
      reviewCount: data.reviewCount,
      translationInfo: {
        create: data.translationInfo
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
