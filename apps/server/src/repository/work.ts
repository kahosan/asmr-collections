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
  exists(id: string) {
    return prisma.work.findUnique({ where: { id }, select: { id: true } }).then(d => d !== null);
  }
};
