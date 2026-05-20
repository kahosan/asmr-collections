import type { Prisma } from '~/lib/prisma/client';

import type { FindManyWorksQuery } from './utils';

import { createHash } from 'node:crypto';

import { Hono } from 'hono';
import { match } from 'ts-pattern';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- ig
import { LRUCache } from 'lru-cache';
import { IndexSearchQuerySchema } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { ttl } from '~/lib/cachified';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';

import { categorizeWorks, findManyByEmbedding, sortIdsBySeed, whereBuilder } from './utils';

export const worksApp = new Hono();

const randomSortCache = new LRUCache<string, string[]>({
  max: 50,
  ttl: ttl.minute(30)
});

function createRandomSortCacheKey(params: Record<string, unknown>, seed: string) {
  return createHash('sha256')
    .update(seed)
    .update('\0')
    .update(JSON.stringify(params))
    .digest('hex');
}

worksApp.get('/', zValidator('query', IndexSearchQuerySchema), async c => {
  const query = c.req.valid('query');

  // pagination
  const { page, limit, seed } = query;

  // filter
  const { artistCount, storageFilter } = query;

  // sort
  const { order, sort } = query;

  // search type
  const { embedding } = query;

  const include: Prisma.WorkInclude = {
    circle: true,
    series: true,
    artists: true,
    illustrators: true,
    genres: true,
    translationInfo: true
  };

  const where = whereBuilder(query);

  const queryArgs: FindManyWorksQuery = {
    where,
    orderBy: match(sort)
      .returnType<Prisma.WorkOrderByWithRelationInput>()
      .with('playCount', () => ({ playback: { count: order } }))
      .otherwise(() => ({ [sort]: order })),
    include
  };

  try {
    if (embedding)
      return c.json(await findManyByEmbedding(embedding, include));

    if (storageFilter) {
      const { stored, orphaned } = await categorizeWorks();
      if (storageFilter === 'only') {
        queryArgs.where = {
          ...queryArgs.where,
          id: { in: stored }
        };
      } else {
        queryArgs.where = {
          ...queryArgs.where,
          id: { in: orphaned }
        };
      }
    }

    if (sort === 'playCount') {
      queryArgs.where = {
        AND: [
          queryArgs.where || {},
          { playback: { isNot: null } }
        ]
      };
    }

    const prisma = getPrisma();

    if (artistCount) {
      const targetIds = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT w.id FROM "Work" w
        JOIN "_ArtistToWork" aw ON aw."B" = w.id
        GROUP BY w.id
        HAVING COUNT(aw."A") = ${artistCount}
      `;

      queryArgs.where = {
        AND: [
          queryArgs.where || {},
          { id: { in: targetIds.map(item => item.id) } }
        ]
      };
    }

    if (sort === 'random') {
      const randomSeed = seed ?? 'random';
      const randomCacheKey = createRandomSortCacheKey({
        where: queryArgs.where ?? {},
        artistCount
      }, randomSeed);

      let shuffledIds = randomSortCache.get(randomCacheKey);

      if (!shuffledIds) {
        const allIds = await prisma.work.findMany({
          where: queryArgs.where,
          select: { id: true }
        });

        shuffledIds = sortIdsBySeed(
          allIds.map(item => item.id),
          randomSeed
        );

        randomSortCache.set(randomCacheKey, shuffledIds);
      }

      const total = shuffledIds.length;

      const offset = (page - 1) * limit;
      const slicedIds = shuffledIds.slice(offset, offset + limit);

      const works = await prisma.work.findMany({
        where: { id: { in: slicedIds } },
        include: queryArgs.include
      });

      const idToIndex = new Map(slicedIds.map((id, index) => [id, index]));
      const sorted = works.sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0));

      return c.json({
        page,
        limit,
        total,
        data: sorted
      });
    }

    const [works, total] = await prisma.$transaction([
      prisma.work.findMany({
        ...queryArgs,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.work.count({ where: queryArgs.where })
    ]);

    return c.json({
      page,
      limit,
      total,
      data: works
    });
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
});
