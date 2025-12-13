import type * as z from 'zod';
import type { IndexSearchQuerySchema } from '@asmr-collections/shared';

import type { WorkInclude } from '~/lib/prisma/models';
import type { Prisma, PrismaClient } from '~/lib/prisma/client';

import { storage } from '~/storage';
import { getPrisma } from '~/lib/db';
import { generateEmbedding } from '~/ai/jina';

export type FindManyWorksQuery = Parameters<PrismaClient['work']['findMany']>[0];

export function whereBuilder(query: z.infer<typeof IndexSearchQuerySchema>) {
  const {
    circleId, seriesId, illustratorId, artistId, genres,
    subtitles, multilingual, age, keyword, embedding, filterOp
  } = query;

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

  let where: Prisma.WorkWhereInput = {};

  if (AND.length) where.AND = AND;
  if (OR.length) where.OR = OR;

  if (keyword && !embedding) {
    const searchCondition: Prisma.WorkWhereInput = {
      OR: [
        { id: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
        { circle: { name: { contains: keyword, mode: 'insensitive' } } },
        { series: { name: { contains: keyword, mode: 'insensitive' } } },
        { artists: { some: { name: { contains: keyword, mode: 'insensitive' } } } },
        { illustrators: { some: { name: { contains: keyword, mode: 'insensitive' } } } }
      ]
    };

    if (AND.length === 0 && OR.length === 0)
      where = searchCondition;
    else
      where = { AND: [where, searchCondition] };
  }

  return where;
}

export async function findManyByEmbedding(text: string, include: WorkInclude) {
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

  const works = await prisma.work.findMany({
    where: { id: { in: ids } },
    include
  });

  const sortedWorks = works.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return {
    data: sortedWorks
  };
};

export async function findManyByArtistCount(queryArgs: FindManyWorksQuery, count: number, page: number, limit: number) {
  const prisma = getPrisma();

  const targetIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT w.id FROM "Work" w
    JOIN "_ArtistToWork" aw ON aw."B" = w.id
    GROUP BY w.id
    HAVING COUNT(aw."A") = ${count}
  `;

  const where = {
    AND: [
      queryArgs?.where || {},
      { id: { in: targetIds.map(item => item.id) } }
    ]
  };

  const [works, total] = await prisma.$transaction([
    prisma.work.findMany({
      ...queryArgs,
      where,
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.work.count({ where })
  ]);

  return {
    page,
    limit,
    total,
    data: works
  };
}

export async function categorizeWorks() {
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
