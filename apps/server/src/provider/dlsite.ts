import type { WorkInfo } from '~/types/source';
import type { PopularWorks } from '~/types/popular';

import { parseDLsiteProductDetailResponse, parseDLsiteProductStatsResponse } from '@asmr-collections/shared';

import * as cheerio from 'cheerio';

import { fetcher } from '~/lib/fetcher';

interface PopularResponse {
  data: {
    voice: {
      products: Array<{
        rank: number
        id: string
        name: string
        maker: {
          id: string
          name: string
        }
        tags: Array<{
          id: number
          label: string
        }>
        description: string
        img: {
          originalUrl: string
        }
      }>
    }
  }
}

interface ProductDetails {
  maker: {
    id: string
    name: string
  }
  artists: string[]
  illustrators: string[]
  intro: string
  tags: Array<{
    id: number
    name: string
  }>
}

class DLsiteProvider {
  readonly #host = 'https://www.dlsite.com';

  async popular(limit = 100): Promise<PopularWorks> {
    const data = await fetcher<PopularResponse>(`${this.#host}/maniax/api/=/globalRanking.json?area=global&category=voice&term=day`);
    return data.data.voice.products
      .map(p => ({
        id: p.id,
        rank: p.rank,
        name: p.name,
        cover: p.img.originalUrl,
        intro: p.description,
        circle: p.maker,
        genres: p.tags.map(tag => ({
          id: tag.id,
          name: tag.label
        }))
      }))
      .slice(0, limit);
  }

  async product(id: string): Promise<WorkInfo | null> {
    const response = await fetcher<unknown>(`${this.#host}/home/product/info/ajax?product_id=${encodeURIComponent(id)}&locale=zh_CN`);
    const data = parseDLsiteProductStatsResponse(response, id);
    if (!data) return null;

    const other = await this.#productDetails(id);

    return {
      id,
      name: data.work_name,
      age_category: data.age_category,
      artists: other.artists,
      illustrators: other.illustrators,
      image_main: data.work_image,
      intro: other.intro,
      maker: other.maker,
      series: data.title_id && data.title_name
        ? {
          id: data.title_id,
          name: data.title_name
        }
        : undefined,
      genres: other.tags,
      release_date: new Date(data.regist_date),
      price: data.price ?? undefined,
      sales: data.dl_count ?? undefined,
      rating: data.rate_average_2dp ?? undefined,
      rating_count: data.rate_count ?? undefined,
      review_count: data.review_count ?? undefined,
      translation_info: data.translation_info,
      language_editions: data.dl_count_items?.map(item => ({
        lang: item.lang,
        work_id: item.workno,
        label: item.display_label
      })) ?? undefined,
      rating_count_detail: data.rate_count_detail ?? undefined,
      wishlist_count: data.wishlist_count ?? undefined
    };
  }

  async #productDetails(id: string): Promise<ProductDetails> {
    try {
      const response = await fetcher<unknown>(`${this.#host}/maniax/api/=/product.json?workno=${encodeURIComponent(id)}&locale=zh_CN`);
      const data = parseDLsiteProductDetailResponse(response, id);
      if (!data)
        throw new Error('商品详情接口未返回请求的作品');

      return {
        maker: {
          id: data.maker_id,
          name: data.maker_name
        },
        artists: data.creaters?.voice_by?.map(creator => creator.name) ?? [],
        illustrators: data.creaters?.illust_by?.map(creator => creator.name) ?? [],
        intro: data.intro_s ?? '',
        tags: data.genres.map(genre => ({
          id: genre.id,
          name: genre.name
        }))
      };
    } catch (error) {
      console.warn(`获取 ${id} 的 DLsite 商品详情 JSON 失败，回退到 HTML 解析`, error);
      return this.#parserProductHTML(id);
    }
  }

  async #parserProductHTML(id: string): Promise<ProductDetails> {
    const str = await fetcher<string>(`${this.#host}/maniax/work/=/product_id/${encodeURIComponent(id)}.html/?locale=zh_CN`, {
      headers: {
        Cookie: 'locale=zh-cn'
      }
    });

    const $ = cheerio.load(str);

    const maker = $('table#work_maker').find('span.maker_name > a');
    const makerId = maker.attr('href')?.split('/').pop()?.replaceAll('.html', '');
    const makerName = maker.text().trim();

    if (!makerId || !makerName)
      throw new Error('解析社团信息时未能找到社团 ID 或名称');

    let artists: string[] = [];
    let illustrators: string[] = [];
    $('table#work_outline').find('th').each((_, el) => {
      const text = $(el).text().trim();

      if (text === '声优')
        artists = $(el).parent('tr').find('td a').map((_, el) => $(el).text().trim()).toArray();

      else if (text === '插画')
        illustrators = $(el).parent('tr').find('td a').map((_, el) => $(el).text().trim()).toArray();
    });

    const tags = $('div.main_genre > a').map((_, el) => {
      return {
        id: Number.parseInt($(el).attr('href')?.match(/\d+/g)?.at(0) ?? '', 10),
        name: $(el).text().trim()
      };
    }).toArray();

    const intro = $('meta[name="description"]').attr('content')?.replace(/「DLsite.*/, '').trim() ?? '';

    return {
      maker: {
        id: makerId,
        name: makerName
      },
      artists,
      illustrators,
      intro,
      tags
    };
  }
}

export const dlsite = new DLsiteProvider();
