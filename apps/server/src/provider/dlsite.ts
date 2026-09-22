import type { Data, DLsiteRankPeriod } from '@asmr-collections/shared';

import type { SourceWork } from '~/types/source';
import type { PopularWork, PopularWorks } from '~/types/popular';

import { parseDLsiteProductDetailResponse, parseDLsiteProductHTMLResponse, parseDLsiteProductStatsResponse } from '@asmr-collections/shared';

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
        }> | null
        voiceBys: Array<Data<string>> | null
        description: string
        img: {
          originalUrl: string
        }
      }>
    }
  }
}

type ProductDetails = Pick<SourceWork, 'circle' | 'artists' | 'illustrators' | 'intro' | 'genres'>;

/**
 * 推导日文原版 id。
 *
 * DLsite 有两套翻译体系：
 * - 「大家一起来翻译」：译版的 translation_info.original_workno 指向原版
 * - 官方翻译：社团自己发布的各语言版，所有成员都是 is_original，没有任何父子指针，
 *   只能靠共享的 dl_count_items 里的日语条目找到原版
 *
 * lang 可能是逗号分隔的列表（作品本身包含多种语言），按拆分后匹配 JPN
 */
export function resolveOriginalId(
  id: string,
  originalWorkno: string | null | undefined,
  editions: Array<{ workId: string, lang: string }>
): string {
  return originalWorkno
    ?? editions.find(e => e.lang.split(',').includes('JPN'))?.workId
    ?? id;
}

class DLsiteProvider {
  readonly #host = 'https://www.dlsite.com';

  readonly #client = <T>(endpoint: string) => {
    return fetcher<T>(new URL(endpoint, this.#host), {
      headers: {
        Cookie: 'locale=zh-cn'
      }
    });
  };

  async popular(period: DLsiteRankPeriod, limit = 100): Promise<PopularWorks> {
    const data = await this.#client<PopularResponse>(`/maniax/api/=/globalRanking.json?area=global&category=voice&term=${period}`);
    return data.data.voice.products
      .map<PopularWork>(p => ({
        id: p.id,
        rank: p.rank,
        name: p.name,
        cover: p.img.originalUrl,
        intro: p.description,
        artists: p.voiceBys,
        circle: p.maker,
        genres: p.tags?.map(tag => ({
          id: tag.id,
          name: tag.label
        })) ?? []
      }))
      .slice(0, limit);
  }

  async product(id: string): Promise<SourceWork | null> {
    const response = await this.#client<unknown>(`/home/product/info/ajax?product_id=${encodeURIComponent(id)}&locale=zh_CN`);
    const data = parseDLsiteProductStatsResponse(response, id);
    if (!data) return null;

    const details = await this.#productDetails(id);
    const series = data.title_id && data.title_name
      ? { id: data.title_id, name: data.title_name }
      : null;
    const languageEditions = data.dl_count_items?.map(item => ({
      lang: item.lang,
      workId: item.workno,
      label: item.display_label
    })) ?? [];

    return Object.assign(details, {
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
      originalId: resolveOriginalId(id, data.translation_info.original_workno, languageEditions),
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
      languageEditions
    });
  }

  /**
   * 解析作品：若 id 是译者版，则返回其所属语言版的数据。
   * requestedId 始终为传入的 id，便于调用方判断是否发生了跳转。
   */
  async resolve(id: string): Promise<{ data: SourceWork, requestedId: string } | null> {
    const data = await this.product(id);
    if (!data) return null;

    const parentId = data.translationInfo.parentWorkno;
    if (!data.translationInfo.isChild || !parentId || parentId === id)
      return { data, requestedId: id };

    // 语言版理论上可能已下架，此时回退为译者版自身
    const parent = await this.product(parentId);
    return { data: parent ?? data, requestedId: id };
  }

  async #productDetails(id: string): Promise<ProductDetails> {
    try {
      const [response, _data] = await Promise.all([
        this.#client<unknown>(`/maniax/api/=/product.json?workno=${encodeURIComponent(id)}&locale=zh_CN`),
        this.#parserProductHTML(id)
      ]);

      const data = parseDLsiteProductDetailResponse(response, id);
      if (!data) throw new Error('商品详情接口未返回请求的作品');

      const creators = Array.isArray(data.creaters) ? undefined : data.creaters;

      return {
        circle: {
          id: _data.circle.id,
          name: _data.circle.name
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
    const str = await this.#client<string>(`/maniax/work/=/product_id/${encodeURIComponent(id)}.html/?locale=zh_CN`);

    const $ = cheerio.load(str);

    const maker = $('table#work_maker').find('span.maker_name > a');
    const makerId = maker.attr('href')?.split('/').pop()?.replaceAll('.html', '') ?? '';
    const makerName = maker.text().trim();

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

    return parseDLsiteProductHTMLResponse({
      circle: { id: makerId, name: makerName },
      artists: artists.map(name => ({ id: 'unknown', name })),
      illustrators: illustrators.map(name => ({ id: 'unknown', name })),
      intro,
      genres
    }, id);
  }
}

export const dlsite = new DLsiteProvider();
