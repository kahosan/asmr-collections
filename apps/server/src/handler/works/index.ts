import type { Prisma, PrismaClient } from '@prisma/client';
import type { Work } from '~/types/collection';
import { join } from 'node:path';

import { Hono } from 'hono';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import { getPrisma } from '~/lib/db';
import { filterSubtitles, formatError, generateEmbedding, workIsExistsInLocal } from '../utils';

type FindManyWorksQuery = Parameters<PrismaClient['work']['findMany']>[0];

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
    filterOp = 'and',
    existsLocal
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

    if (age)
      AND = AND.concat({ ageCategory: { equals: Number.parseInt(age, 10) } });

    if (seriesId)
      AND = AND.concat({ series: { id: seriesId } });

    if (circleId)
      AND = AND.concat({ circle: { id: circleId } });

    if (subtitles)
      AND = AND.concat({ subtitles: { not: { equals: null } } });

    if (multilingual)
      AND = AND.concat({ languageEditions: { isEmpty: false } });
  }

  if (filterOp === 'or') {
    if (genres && genres.length > 0)
      OR = OR.concat(genres.map(id => ({ genres: { some: { id } } })));

    if (artistId && artistId.length > 0)
      OR = OR.concat(artistId.map(id => ({ artists: { some: { id } } })));

    if (illustratorId)
      OR = OR.concat({ illustrators: { some: { id: illustratorId } } });

    if (age)
      OR = OR.concat({ ageCategory: { equals: Number.parseInt(age, 10) } });

    if (seriesId)
      OR = OR.concat({ series: { id: seriesId } });

    if (circleId)
      OR = OR.concat({ circle: { id: circleId } });

    if (subtitles)
      OR = OR.concat({ subtitles: { not: { equals: null } } });

    if (multilingual)
      OR = OR.concat({ languageEditions: { isEmpty: false } });
  }

  // 使用关键词搜索时，上面的条件会被忽略，因为不会携带其他参数了
  if (keyword && !embedding) {
    OR = OR.concat([
      { id: { contains: keyword, mode: 'insensitive' } },
      { name: { contains: keyword, mode: 'insensitive' } }
    ]);
  }

  const queryArgs: FindManyWorksQuery = {
    where: {
      AND: AND.length > 0 ? AND : undefined,
      OR: OR.length > 0 ? OR : undefined
    },
    orderBy: {
      [sort]: order
    },
    include: {
      circle: true,
      series: true,
      artists: true,
      illustrators: true,
      genres: true,
      translationInfo: true
    }
  };

  if (existsLocal) {
    if (!VOICE_LIBRARY || !HOST_URL)
      return c.json({ message: '本地音声库或域名没有配置' }, 500);

    try {
      const { existsIds, noExistsIds } = await getLocalWorkIds(VOICE_LIBRARY);
      if (existsLocal === 'only') {
        queryArgs.where = {
          ...queryArgs.where,
          id: { in: existsIds }
        };
      } else if (existsLocal === 'exclude') {
        queryArgs.where = {
          ...queryArgs.where,
          id: { in: noExistsIds }
        };
      }
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  }

  try {
    function buildQuery(ids: string[]) {
      return {
        where: {
          id: { in: ids },
          AND: AND.length > 0 ? AND : undefined,
          OR: OR.length > 0 ? OR : undefined
        },
        include: {
          circle: true,
          series: true,
          artists: true,
          illustrators: true,
          genres: true,
          translationInfo: true
        }
      } satisfies FindManyWorksQuery;
    }
    if (embedding)
      return c.json(await queryWorksByEmbedding(embedding, buildQuery));
  } catch (e) {
    return c.json(formatError(e), 500);
  }

  const prisma = getPrisma();

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

async function queryWorksByEmbedding(text: string, buildQuery: (ids: string[]) => FindManyWorksQuery) {
  if (!text)
    throw new Error('缺少查询文本');

  const embeddingText = await generateEmbedding(text);
  if (embeddingText === undefined || embeddingText.length === 0)
    throw new Error('无法生成文本向量');

  const vectorString = `[${embeddingText.join(',')}]`;
  const prisma = getPrisma();

  const _i = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Work"
    ORDER BY embedding <=> ${vectorString}::vector
    LIMIT 20;
  `;

  const ids = _i.map(item => item.id);

  if (!Array.isArray(_i) || _i.length === 0)
    return { data: [] };

  const works = await prisma.work.findMany(
    buildQuery(_i.map(item => item.id))
  );

  const sortedWorks = works.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return {
    data: filterSubtitles(sortedWorks)
  };
};

async function getLocalWorkIds(voiceLibrary: string) {
  const prisma = getPrisma();

  const ids = await prisma.work.findMany({ select: { id: true } });

  const results = await Promise.all(
    ids.map(async ({ id }) => ({
      id,
      exists: await workIsExistsInLocal(join(voiceLibrary, id))
    }))
  );

  const { existsIds, noExistsIds } = results.reduce<Record<'existsIds' | 'noExistsIds', string[]>>(
    (acc, { id, exists }) => {
      if (exists)
        acc.existsIds.push(id);
      else
        acc.noExistsIds.push(id);
      return acc;
    },
    { existsIds: [], noExistsIds: [] }
  );

  return { existsIds, noExistsIds };
}
