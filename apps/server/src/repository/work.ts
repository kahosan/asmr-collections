import type { ServerWork, WorkEdition } from '@asmr-collections/shared';

import type { SourceWork } from '~/types/source';
import type { Prisma } from '~/lib/prisma/client';

import { prisma } from '~/lib/db';

const WORK_INCLUDE = {
  circle: true,
  series: true,
  artists: true,
  illustrators: true,
  genres: true,
  translationInfo: true
} satisfies Prisma.WorkInclude;

type LanguageEdition = SourceWork['languageEditions'][number];

export const workRepo = {
  /**
   * 按任意 RJ 号解析库内作品：精确命中优先，其次是“它是某个已入库语言版的译者版”
   */
  resolve(id: string) {
    return prisma.work.findMany({
      where: {
        OR: [
          { id },
          { translationInfo: { childWorknos: { has: id } } }
        ]
      },
      include: { ...WORK_INCLUDE, playback: true }
    }).then(works => works.find(w => w.id === id) ?? works.at(0) ?? null);
  },
  /**
   * 生成家族各语言版列表并标记是否已入库。
   * 以传入的列表为底，并上库内同家族各成员的 languageEditions 快照：
   * 只要任一成员的快照是新的，全家读到的就是新的，不需要写入时同步
   */
  async editions(originalId: string, base: LanguageEdition[]): Promise<WorkEdition[]> {
    const family = await prisma.work.findMany({
      where: { originalId },
      select: { id: true, name: true, cover: true, languageEditions: true }
    });

    const merged = new Map(base.map(e => [e.workId, e]));
    for (const member of family) {
      for (const e of member.languageEditions as LanguageEdition[])
        merged.set(e.workId, e);
    }

    const library = new Map(family.map(w => [w.id, w]));
    return Array.from(merged.values(), e => {
      const work = library.get(e.workId);
      return {
        workId: e.workId,
        lang: e.lang,
        label: e.label,
        original: e.workId === originalId,
        library: work !== undefined,
        name: work?.name,
        cover: work?.cover
      };
    });
  },
  create(data: SourceWork, id: string) {
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
      include: WORK_INCLUDE
    });
  },
  update(data: SourceWork, id: string) {
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
      include: WORK_INCLUDE
    });
  },
  async ensureRelations(works: SourceWork[]) {
    const circles = new Map<string, string>();
    const series = new Map<string, string>();
    const artists = new Map<string, string>();
    const illustrators = new Map<string, string>();
    const genres = new Map<number, string>();

    for (const data of works) {
      circles.set(data.circle.id, data.circle.name);
      if (data.series?.id) series.set(data.series.id, data.series.name);
      data.artists.forEach(({ name }) => artists.set(name, name));
      data.illustrators.forEach(({ name }) => illustrators.set(name, name));
      data.genres.forEach(genre => genres.set(genre.id, genre.name));
    }

    const result = await Promise.allSettled([
      circles.size > 0 && prisma.circle.createMany({
        data: Array.from(circles, ([id, name]) => ({ id, name })),
        skipDuplicates: true
      }),
      series.size > 0 && prisma.series.createMany({
        data: Array.from(series, ([id, name]) => ({ id, name })),
        skipDuplicates: true
      }),
      artists.size > 0 && prisma.artist.createMany({
        data: Array.from(artists, ([name]) => ({ name })),
        skipDuplicates: true
      }),
      illustrators.size > 0 && prisma.illustrator.createMany({
        data: Array.from(illustrators, ([name]) => ({ name })),
        skipDuplicates: true
      }),
      genres.size > 0 && prisma.genre.createMany({
        data: Array.from(genres, ([id, name]) => ({ id, name })),
        skipDuplicates: true
      })
    ]);

    const rejected = result.filter(item => item.status === 'rejected');
    if (rejected.length > 0) {
      console.error('批量创建关联数据部分失败：', rejected.map(item => item.reason));
      throw new Error('批量创建关联数据失败');
    }
  },
  updateEmbedding(workId: string, embedding: number[]) {
    const vectorString = `[${embedding.join(',')}]`;
    return prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${workId}`;
  },
  async similar(id: string, limit: number): Promise<ServerWork[]> {
    const similarIds = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH target AS (
        SELECT embedding FROM "Work" WHERE id = ${id}
      )
      SELECT w.id
      FROM "Work" w, target
      WHERE w.embedding IS NOT NULL
        AND w.id != ${id}
        AND target.embedding IS NOT NULL
      ORDER BY w.embedding <=> target.embedding
      LIMIT ${limit}
    `;

    if (similarIds.length === 0) return [];

    const targetIds = similarIds.map(item => item.id);

    const works = await prisma.work.findMany({
      where: {
        id: { in: targetIds }
      },
      include: WORK_INCLUDE
    });

    return works.sort((left, right) => targetIds.indexOf(left.id) - targetIds.indexOf(right.id)) as unknown as ServerWork[];
  },
  async getIdsByEmbedding(embedding: number[], limit: number) {
    const vectorString = `[${embedding.join(',')}]`;
    const works = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Work"
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit};
    `;

    if (!Array.isArray(works) || works.length === 0)
      return [];

    return works.map(work => work.id);
  },
  exists(id: string) {
    return prisma.work.findUnique({ where: { id }, select: { id: true } }).then(d => d !== null);
  }
};
