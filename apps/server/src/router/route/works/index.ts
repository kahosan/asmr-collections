import type { Prisma } from '~/lib/prisma/client';

import type { FindManyWorksQuery } from './utils';

import { Hono } from 'hono';
import { IndexSearchQuerySchema } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';

import { categorizeWorks, findManyByArtistCount, findManyByEmbedding, whereBuilder } from './utils';

export const worksApp = new Hono();

worksApp.get('/', zValidator('query', IndexSearchQuerySchema), async c => {
  const query = c.req.valid('query');

  // pagination
  const { page, limit } = query;

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
    orderBy: {
      [sort]: order
    },
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

    const prisma = getPrisma();

    if (sort === 'random') {
      const allIds = await prisma.work.findMany({
        where: queryArgs.where,
        select: { id: true }
      });

      // 这里可能重复随机到相同的 id
      // TODO: 可以用 seed 优化，保证每次分页结果不重复 但是懒得做
      const shuffledIds = allIds
        .map(item => item.id)
        .sort(() => Math.random() - 0.5);

      const total = shuffledIds.length;

      const offset = (page - 1) * limit;
      const slicedIds = shuffledIds.slice(offset, offset + limit);

      const works = await prisma.work.findMany({
        where: { id: { in: slicedIds } },
        include: queryArgs.include
      });

      return c.json({
        page,
        limit,
        total,
        data: works
      });
    }

    if (artistCount)
      return c.json(await findManyByArtistCount(queryArgs, artistCount, page, limit));

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
    return c.json(formatError(e), 500);
  }
});
