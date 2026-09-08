import type { DLsiteRankPeriod } from '@asmr-collections/shared';

import type { SourceWork } from '~/types/source';
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

type ProductDetails = Pick<SourceWork, 'circle' | 'artists' | 'illustrators' | 'intro' | 'genres'>;

class DLsiteProvider {
  readonly #host = 'https://www.dlsite.com';

  async popular(period: DLsiteRankPeriod, limit = 100): Promise<PopularWorks> {
    const data = await fetcher<PopularResponse>(`${this.#host}/maniax/api/=/globalRanking.json?area=global&category=voice&term=${period}`);
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

  async product(id: string): Promise<SourceWork | null> {
    const response = await fetcher<unknown>(`${this.#host}/home/product/info/ajax?product_id=${encodeURIComponent(id)}&locale=zh_CN`);
    const data = parseDLsiteProductStatsResponse(response, id);
    if (!data) return null;

    const details = await this.#productDetails(id);
    const series = data.title_id && data.title_name
      ? { id: data.title_id, name: data.title_name }
      : null;

    return {
      ...details,
      id,
      name: data.work_name,
      cover: data.work_image,
      circleId: details.circle.id,
      seriesId: series?.id ?? null,
      series,
      ageCategory: data.age_category,
      releaseDate: new Date(data.regist_date),
      price: data.price ?? 0,
      sales: data.dl_count ?? 0,
      rate: data.rate_average_2dp ?? 0,
      rateCount: data.rate_count ?? 0,
      reviewCount: data.review_count ?? 0,
      wishlistCount: data.wishlist_count ?? 0,
      originalId: data.translation_info.original_workno,
      translationInfo: {
        isVolunteer: data.translation_info.is_volunteer,
        isOriginal: data.translation_info.is_original,
        isParent: data.translation_info.is_parent,
        isChild: data.translation_info.is_child,
        isTranslationBonusChild: data.translation_info.is_translation_bonus_child,
        originalWorkno: data.translation_info.original_workno,
        parentWorkno: data.translation_info.parent_workno,
        childWorknos: data.translation_info.child_worknos,
        lang: data.translation_info.lang
      },
      languageEditions: data.dl_count_items?.map(item => ({
        lang: item.lang,
        workId: item.workno,
        label: item.display_label
      })) ?? []
    };
  }

  async #productDetails(id: string): Promise<ProductDetails> {
    try {
      const response = await fetcher<unknown>(`${this.#host}/maniax/api/=/product.json?workno=${encodeURIComponent(id)}&locale=zh_CN`);
      const data = parseDLsiteProductDetailResponse(response, id);
      if (!data)
        throw new Error('商品详情接口未返回请求的作品');

      const creators = Array.isArray(data.creaters) ? undefined : data.creaters;

      return {
        circle: {
          id: data.maker_id,
          name: data.maker_name
        },
        artists: creators?.voice_by ?? [],
        illustrators: creators?.illust_by ?? [],
        intro: data.intro_s ?? '',
        genres: data.genres.map(genre => ({
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

    const genres = $('div.main_genre > a').map((_, el) => {
      return {
        id: Number.parseInt($(el).attr('href')?.match(/\d+/g)?.at(0) ?? '', 10),
        name: $(el).text().trim()
      };
    }).toArray();

    const intro = $('meta[name="description"]').attr('content')?.replace(/「DLsite.*/, '').trim() ?? '';

    return {
      circle: {
        id: makerId,
        name: makerName
      },
      artists: artists.map(name => ({ id: 'unknow', name })),
      illustrators: illustrators.map(name => ({ id: 'unknow', name })),
      intro,
      genres
    };
  }
}

export const dlsite = new DLsiteProvider();
