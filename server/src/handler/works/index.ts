import type { Prisma } from '@prisma/client';
import type { Work } from '~/types/collection';
import { Hono } from 'hono';

import prisma from '~/lib/db';
import { filterSubtitles, formatError, generateEmbedding } from '../utils';

type FindManyWorksQuery = Parameters<typeof prisma.work.findMany>[0];
type FindUniqueWorkQuery = Parameters<typeof prisma.work.findUnique>[0];

export const worksApp = new Hono();

worksApp.get('/', async c => {
  const {
    page: _page,
    limit: _limit
  } = c.req.query();

  const page = Number.parseInt(_page || '1', 10);
  const limit = Number.parseInt(_limit || '20', 10);

  // filter
  const {
    circleId,
    seriesId,
    illustratorId: _illustratorId,
    artistId: _artistId,
    artistCount: _artistCount,
    genres: _genres,
    multilingual,
    subtitles,
    keyword,
    age,
    filterOp = 'and'
  } = c.req.query();

  // sort
  const {
    order = 'desc',
    sort = 'releaseDate'
  } = c.req.query();

  // search type
  const { embedding } = c.req.query();

  const genres = (_genres || undefined)?.split(',').map(id => Number.parseInt(id, 10));
  const artistId = (_artistId || undefined)?.split(',').map(id => Number.parseInt(id, 10));
  const artistCount = _artistCount ? Number.parseInt(_artistCount, 10) : undefined;
  const illustratorId = Number.parseInt(_illustratorId, 10);

  let AND: Prisma.WorkWhereInput[] = [];
  let OR: Prisma.WorkWhereInput[] = [];

  if (filterOp === 'and') {
    if (genres && genres.length > 0)
      AND = AND.concat(genres.map(id => ({ genres: { some: { id } } })));
    if (artistId && artistId.length > 0)
      AND = AND.concat(artistId.map(id => ({ artists: { some: { id } } })));
    if (illustratorId)
      AND = AND.concat({ illustrators: { some: { id: illustratorId } } });
  }

  if (filterOp === 'or') {
    if (genres && genres.length > 0)
      OR = OR.concat(genres.map(id => ({ genres: { some: { id } } })));
    if (artistId && artistId.length > 0)
      OR = OR.concat(artistId.map(id => ({ artists: { some: { id } } })));
    if (illustratorId)
      OR = OR.concat({ illustrators: { some: { id: illustratorId } } });
  }

  // 使用关键词搜索时，上面的条件会被忽略，因为不会携带其他参数了
  if (keyword && !embedding) {
    OR = OR.concat([
      { id: { contains: keyword } },
      { name: { contains: keyword } }
    ]);
  }

  const queryArgs: FindManyWorksQuery = {
    where: {
      AND: AND.length > 0 ? AND : undefined,
      OR: OR.length > 0 ? OR : undefined,
      ageCategory: age ? { equals: Number.parseInt(age, 10) } : undefined,
      circle: circleId ? { id: circleId } : undefined,
      series: seriesId ? { id: seriesId } : undefined,
      subtitles: subtitles ? { not: { equals: null } } : undefined,
      languageEditions: multilingual ? { isEmpty: false } : undefined
    },
    orderBy: {
      [sort]: order
    },
    include: {
      circle: true,
      series: true,
      artists: true,
      illustrators: true,
      genres: true
    }
  };

  try {
    function buildQuery(id: string) {
      return {
        where: {
          id,
          AND: AND.length > 0 ? AND : undefined,
          OR: OR.length > 0 ? OR : undefined,
          ageCategory: age ? { equals: Number.parseInt(age, 10) } : undefined,
          circle: circleId ? { id: circleId } : undefined,
          series: seriesId ? { id: seriesId } : undefined,
          subtitles: subtitles ? { not: { equals: null } } : undefined,
          languageEditions: multilingual ? { isEmpty: false } : undefined
        },
        include: {
          circle: true,
          series: true,
          artists: true,
          illustrators: true,
          genres: true
        }
      } satisfies FindUniqueWorkQuery;
    }
    if (embedding)
      return c.json(await queryWorksByEmbedding(embedding, buildQuery));
  } catch (e) {
    return c.json(formatError(e), 500);
  }

  try {
    if (artistCount) {
      const works = await prisma.work.findMany(queryArgs)
        .then(works => {
          return (works as unknown as Work[])
            .filter(work => (artistCount ? work.artists.length === artistCount : true));
        });

      const total = works.length;
      const offset = (page - 1) * limit;
      const data = works.slice(offset, offset + limit);

      return c.json({
        page,
        limit,
        total,
        data: filterSubtitles(data)
      });
    }

    const works = await prisma.work.findMany({
      ...queryArgs,
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.work.count({
      where: queryArgs.where
    });

    return c.json({
      page,
      limit,
      total,
      data: filterSubtitles(works)
    });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

async function queryWorksByEmbedding(text: string, buildQuery: (id: string) => FindUniqueWorkQuery) {
  if (!text)
    throw new Error('缺少查询文本');

  const embeddingText = await generateEmbedding(text);
  const ids = await prisma.$queryRaw`SELECT id FROM "Work" ORDER BY embedding <=> ${embeddingText}::vector LIMIT 20;`;

  if (!Array.isArray(ids))
    return { data: [] };

  const works: unknown[] = [];
  const promisesFns = ids.map(async (id: { id: string }) => {
    const work = await prisma.work.findUnique(buildQuery(id.id));
    if (work) works.push(work);
  });
  await Promise.all(promisesFns);

  return {
    data: filterSubtitles(works)
  };
};
