import type { ServerWork } from '@asmr-collections/shared';

import type { Prisma, PrismaClient, Work } from '~/lib/prisma/client';

import { Hono } from 'hono';
import { IndexSearchQuerySchema } from '@asmr-collections/shared';

import { storage } from '~/storage';
import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';
import { generateEmbedding } from '~/ai/jina';

type FindManyWorksQuery = Parameters<PrismaClient['work']['findMany']>[0];

export const worksApp = new Hono();

worksApp.get('/', zValidator('query', IndexSearchQuerySchema), async c => {
  const {
    page,
    limit
  } = c.req.valid('query');

  // filter
  const {
    circleId,
    seriesId,
    illustratorId,
    artistId,
    artistCount,
    genres,
    multilingual,
    subtitles,
    keyword,
    age,
    filterOp,
    existsLocal
  } = c.req.valid('query');

  // sort
  const {
    order,
    sort
  } = c.req.valid('query');

  // search type
  const { embedding } = c.req.query();

  const AND: Prisma.WorkWhereInput[] = [];
  const OR: Prisma.WorkWhereInput[] = [];

  const pushCondition = (condition: Prisma.WorkWhereInput | Prisma.WorkWhereInput[]) => {
    const target = filterOp === 'or' ? OR : AND;
    if (Array.isArray(condition))
      target.push(...condition);
    else
      target.push(condition);
  };

  if (genres && genres.length > 0) {
    const conditions = genres.map(id => {
      if (id < 0) return { genres: { none: { id: Math.abs(id) } } };
      return { genres: { some: { id } } };
    });
    pushCondition(conditions);
  }

  if (artistId && artistId.length > 0) {
    const conditions = artistId.map(id => {
      if (id < 0) return { artists: { none: { id: Math.abs(id) } } };
      return { artists: { some: { id } } };
    });
    pushCondition(conditions);
  }

  if (illustratorId) {
    if (illustratorId < 0)
      pushCondition({ illustrators: { none: { id: Math.abs(illustratorId) } } });
    else
      pushCondition({ illustrators: { some: { id: illustratorId } } });
  }

  if (age) {
    if (age < 0)
      pushCondition({ ageCategory: { not: Math.abs(age) } });
    else
      pushCondition({ ageCategory: age });
  }

  if (seriesId) {
    if (seriesId.startsWith('-')) {
      pushCondition({
        OR: [
          { seriesId: null },
          { seriesId: { not: seriesId.slice(1) } }
        ]
      });
    } else {
      pushCondition({ seriesId });
    }
  }

  if (circleId) {
    if (circleId.startsWith('-'))
      pushCondition({ circleId: { not: circleId.slice(1) } });
    else
      pushCondition({ circleId });
  }

  if (subtitles) pushCondition({ subtitles: { equals: true } });
  if (multilingual) pushCondition({ languageEditions: { isEmpty: false } });

  // 使用关键词搜索时，上面的条件会被忽略，因为不会携带其他参数了
  if (keyword && !embedding) {
    OR.push(
      { id: { contains: keyword, mode: 'insensitive' } },
      { name: { contains: keyword, mode: 'insensitive' } }
    );
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
    try {
      const { stored, orphaned } = await categorizeWorks();
      if (existsLocal === 'only') {
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

      const worksMap = new Map(works.map(w => [w.id, w]));
      const sorted = slicedIds.reduce<Work[]>((acc, id) => {
        const work = worksMap.get(id);
        if (work) acc.push(work);
        return acc;
      }, []);

      return c.json({
        page,
        limit,
        total,
        data: sorted
      });
    }

    if (artistCount) {
      const works = await prisma.work.findMany(queryArgs)
        .then(works => {
          return (works as unknown as ServerWork[])
            .filter(work => (artistCount ? work.artists.length === artistCount : true));
        });

      const total = works.length;
      const offset = (page - 1) * limit;
      const data = works.slice(offset, offset + limit);

      return c.json({
        page,
        limit,
        total,
        data
      });
    }

    const [works, total] = await prisma.$transaction([
      prisma.work.findMany({
        ...queryArgs,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.work.count({
        where: queryArgs.where
      })
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
    data: sortedWorks
  };
};

async function categorizeWorks() {
  const prisma = getPrisma();

  const files = await storage.list();
  const st = new Set(files);

  const ids = await prisma.work.findMany({ select: { id: true } });

  const stored: string[] = [];
  const orphaned: string[] = [];

  ids.forEach(({ id }) => {
    if (st.has(id))
      stored.push(id);
    else
      orphaned.push(id);
  });

  return { stored, orphaned };
}
