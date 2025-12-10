import type { DLsiteResponse, WorkInfo } from '~/types/source';

import * as cheerio from 'cheerio';

import { fetcher } from './fetcher';

const BASE_URI = 'https://www.dlsite.com';

export async function fetchWorkInfo(id: string): Promise<WorkInfo | null> {
  const product = await fetcher<Record<string, DLsiteResponse> | unknown[]>(`${BASE_URI}/home/product/info/ajax?product_id=${id}&locale=zh_CN`);

  if (Array.isArray(product))
    return null;

  const data = product[id];
  const other = await parserWorkHTML(id);

  return {
    id,
    name: data.work_name,
    age_category: data.age_category,
    artists: other.artists,
    illustrators: other.illustrators,
    image_main: data.work_image,
    intro: other.intro,
    maker: other.maker,
    series: {
      id: data.title_id,
      name: data.title_name
    },
    genres: other.tags,
    release_date: new Date(data.regist_date),
    price: data.price,
    sales: data.dl_count,
    rating: data.rate_average_2dp,
    rating_count: data.rate_count,
    review_count: data.review_count,
    translation_info: data.translation_info,
    language_editions: data.dl_count_items?.map(item => ({
      lang: item.lang,
      work_id: item.workno,
      label: item.display_label
    })),
    rating_count_detail: data.rate_count_detail,
    wishlist_count: data.wishlist_count
  };
}

async function parserWorkHTML(id: string) {
  const str = await fetcher<string>(`${BASE_URI}/maniax/work/=/product_id/${id}.html/?locale=zh_CN`, {
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
    id,
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
