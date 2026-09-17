import type { ServerWork } from '@asmr-collections/shared';

import type { SourceWork } from '~/types/source';

import { prisma } from '~/lib/db';

export const workRepo = {
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
      include: {
        circle: true,
        series: true,
        artists: true,
        illustrators: true,
        genres: true,
        translationInfo: true
      }
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
      include: {
        circle: true,
        series: true,
        artists: true,
        illustrators: true,
        genres: true,
        translationInfo: true
      }
    });
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
      include: {
        circle: true,
        series: true,
        artists: true,
        illustrators: true,
        genres: true,
        translationInfo: true
      }
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
