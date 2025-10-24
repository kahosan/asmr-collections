import type { Work } from '~/types/collection';
import { Hono } from 'hono';
import prisma from '~/lib/db';
import { filterSubtitles, formatError } from '../utils';

export const similarApp = new Hono();

similarApp.get('/similar/:id', async c => {
  const { id } = c.req.param();

  try {
    const similarWorks = await prisma.$queryRaw<Work[]>`
      WITH target_work AS (
        SELECT embedding 
        FROM "Work" 
        WHERE id = ${id} AND embedding IS NOT NULL
      )
      SELECT 
        w.id,
        w.name,
        w.cover,
        w.intro,
        w."circleId",
        w."seriesId",
        w."ageCategory",
        w.price,
        w.sales,
        w."wishlistCount",
        w.rate,
        w."rateCount",
        w."reviewCount",
        w."originalId",
        w."languageEditions",
        w.subtitles,
        w."releaseDate",
        w."createdAt",
        w."updatedAt",
        -- Circle 信息
        json_build_object(
          'id', c.id,
          'name', c.name
        ) as circle,
        -- Series 信息 (可能为 NULL)
        CASE 
          WHEN s.id IS NOT NULL THEN json_build_object(
            'id', s.id,
            'name', s.name
          )
          ELSE NULL
        END as series,
        -- Artists 数组 (多对多关系)
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'name', a.name
              ) ORDER BY a.id
            )
            FROM "_ArtistToWork" atw
            JOIN "Artist" a ON a.id = atw."A"
            WHERE atw."B" = w.id
          ),
          '[]'::json
        ) as artists,
        -- Illustrators 数组 (多对多关系)
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', i.id,
                'name', i.name
              ) ORDER BY i.id
            )
            FROM "_IllustratorToWork" itw
            JOIN "Illustrator" i ON i.id = itw."A"
            WHERE itw."B" = w.id
          ),
          '[]'::json
        ) as illustrators,
        -- Genres 数组 (多对多关系)
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', g.id,
                'name', g.name
              ) ORDER BY g.id
            )
            FROM "_GenreToWork" gtw
            JOIN "Genre" g ON g.id = gtw."A"
            WHERE gtw."B" = w.id
          ),
          '[]'::json
        ) as genres,
        -- TranslationInfo (一对一关系)
        (
          SELECT json_build_object(
            'workId', ti."workId",
            'isVolunteer', ti."isVolunteer",
            'isOriginal', ti."isOriginal",
            'isParent', ti."isParent",
            'isChild', ti."isChild",
            'isTranslationBonusChild', ti."isTranslationBonusChild",
            'originalWorkno', ti."originalWorkno",
            'parentWorkno', ti."parentWorkno",
            'childWorknos', ti."childWorknos",
            'lang', ti.lang
          )
          FROM "TranslationInfo" ti
          WHERE ti."workId" = w.id
        ) as "translationInfo"
      FROM "Work" w
      INNER JOIN "Circle" c ON c.id = w."circleId"
      LEFT JOIN "Series" s ON s.id = w."seriesId"
      CROSS JOIN target_work
      WHERE w.embedding IS NOT NULL
      ORDER BY w.embedding <=> target_work.embedding
      LIMIT 10
    `;

    // 检查是否找到结果
    if (similarWorks.length === 0)
      return c.json(formatError('作品不存在或没有向量信息'), 404);

    // 数据后处理：将 JSON 字符串转换为对象
    const data = similarWorks.map(work => ({
      ...work,
      artists: typeof work.artists === 'string' ? JSON.parse(work.artists) : work.artists,
      illustrators: typeof work.illustrators === 'string' ? JSON.parse(work.illustrators) : work.illustrators,
      genres: typeof work.genres === 'string' ? JSON.parse(work.genres) : work.genres,
      circle: typeof work.circle === 'string' ? JSON.parse(work.circle) : work.circle,
      series: work.series && typeof work.series === 'string' ? JSON.parse(work.series) : work.series,
      translationInfo: typeof work.translationInfo === 'string'
        ? JSON.parse(work.translationInfo)
        : work.translationInfo
    }));

    return c.json(filterSubtitles(data));
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
