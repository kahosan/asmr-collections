import { Hono } from 'hono';
import { fetchWorkInfo } from '~/lib/dlsite';
import { HTTPError } from '~/lib/fetcher';

export const infoApp = new Hono();

infoApp.get('/info/:id', async c => {
  const { id } = c.req.param();

  try {
    const data = await fetchWorkInfo(id);

    if (!data)
      return c.json({ message: 'DLsite 不存在此作品' }, 404);

    const work = {
      id: data.id,
      name: data.name,
      cover: data.image_main,
      intro: data.intro,
      circleId: data.maker.id,
      circle: data.maker,
      seriesId: data.series?.id ?? null,
      series: data.series ?? null,
      artists: data.artists ?? [],
      illustrators: data.illustrators ?? [],
      ageCategory: data.age_category,
      genres: data.genres ?? [],
      price: data.price ?? 0,
      sales: data.sales ?? 0,
      wishlistCount: data.wishlist_count ?? 0,
      rate: data.rating ?? 0,
      rateCount: data.rating_count ?? 0,
      originalId: data.id,
      reviewCount: data.review_count ?? 0,
      releaseDate: data.release_date,
      languageEditions: data.language_editions?.map(item => ({
        workId: item.work_id,
        label: item.label,
        lang: item.lang
      })) ?? []
    };

    return c.json(work);
  } catch (e) {
    if (e instanceof HTTPError)
      return c.json({ message: `获取作品信息失败，返回 Code：${e.status}` }, 500);

    return c.json({ message: '获取作品信息失败' }, 500);
  }
});
