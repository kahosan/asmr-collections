import type { WorkInfo } from '~/types/source';

import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { generateEmbedding } from '~/ai/jina';
import { findwork, formatError, saveCoverImage } from '~/router/utils';

import { clearSimilarCache } from './similar';

export const updateApp = new Hono();

updateApp.put('/update/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await findwork(id))
      return c.json({ message: '收藏不存在' }, 400);
  } catch (e) {
    return c.json(formatError(e), 500);
  }

  let data: WorkInfo | null;

  try {
    data = await fetchWorkInfo(id);
  } catch {
    return c.json({ message: '获取作品信息失败' }, 500);
  }

  if (!data) return c.json({ message: 'DLsite 不存在此作品' }, 404);

  try {
    const coverPath = await saveCoverImage(data.image_main, id);
    data.image_main = coverPath ?? data.image_main;
  } catch (e) {
    console.error('保存 cover 图片失败:', e);
  }

  try {
    const work = await updateWork(data, id);

    return c.json(work);
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
});

updateApp.put('/upload/subtitles/:id', async c => {
  const { id } = c.req.param();
  const { subtitles } = await c.req.parseBody<{ subtitles?: File }>();

  if (!subtitles || !(subtitles instanceof File))
    return c.json({ message: '文件格式不正确' }, 400);

  try {
    if (!await findwork(id))
      return c.json({ message: '收藏不存在' }, 400);

    const prisma = getPrisma();

    const newSubtitlesData = Buffer.from(await subtitles.arrayBuffer());

    await prisma.work.update({
      where: { id },
      data: {
        subtitles: true,
        subtitlesData: {
          upsert: {
            create: { data: newSubtitlesData },
            update: { data: newSubtitlesData }
          }
        }
      }
    });

    return c.json({ id });
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
});

updateApp.put('/update/embedding/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await findwork(id))
      return c.json({ message: '收藏不存在' }, 400);
  } catch (e) {
    return c.json(formatError(e), 500);
  }

  let data: WorkInfo | null;

  try {
    data = await fetchWorkInfo(id);
  } catch {
    return c.json({ message: '获取作品信息失败' }, 500);
  }

  if (!data) return c.json({ message: 'DLsite 不存在此作品' }, 404);

  const prisma = getPrisma();

  try {
    const embedding = await generateEmbedding(data);
    if (embedding) {
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
      await clearSimilarCache(id);
    }

    return c.json({ message: '向量更新成功' });
  } catch (e) {
    console.error(e);
    return c.json(formatError(e, '生成向量失败'), 500);
  }
});

export async function updateWork(data: WorkInfo, id: string) {
  const translationInfo = {
    isVolunteer: data.translation_info.is_volunteer,
    isOriginal: data.translation_info.is_original,
    isParent: data.translation_info.is_parent,
    isChild: data.translation_info.is_child,
    isTranslationBonusChild: data.translation_info.is_translation_bonus_child,
    originalWorkno: data.translation_info.original_workno,
    parentWorkno: data.translation_info.parent_workno,
    childWorknos: data.translation_info.child_worknos,
    lang: data.translation_info.lang
  };

  const prisma = getPrisma();

  await prisma.work.update({
    where: { id },
    data: {
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
        : undefined
    }
  });

  return prisma.work.update({
    where: { id },
    data: {
      id: data.id,
      name: data.name,
      cover: data.image_main,
      intro: data.intro,
      circle: {
        update: { name: data.maker.name }
      },
      series: data.series?.id
        ? {
          update: { name: data.series.name }
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
      wishlistCount: data.wishlist_count,
      rate: data.rating ?? 0,
      rateCount: data.rating_count ?? 0,
      reviewCount: data.review_count ?? 0,
      originalId: data.translation_info.original_workno,
      translationInfo: {
        upsert: {
          create: translationInfo,
          update: translationInfo
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
