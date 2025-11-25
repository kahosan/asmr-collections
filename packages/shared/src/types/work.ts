import type { Jsonify } from '../utils';

export interface Data<T extends string | number> { id: T, name: string }

export interface ServerWork {
  id: string
  name: string
  cover: string
  intro: string
  // 社团
  circleId: string
  circle: Data<string>
  // 系列
  seriesId: string | null
  series: Data<string> | null
  // 声优
  artists: Array<Data<number>>
  // 画师
  illustrators: Array<Data<number>>
  ageCategory: 1 | 2 | 3 // 1: 全年齢, 2: R15, 3: R18
  // tags
  genres: Array<Data<number>>
  price: number
  sales: number
  wishlistCount: number
  rate: number
  rateCount: number
  originalId: string | null
  reviewCount: number
  releaseDate: Date
  translationInfo: {
    isVolunteer: boolean
    // 日文原版
    isOriginal: boolean
    // 社团为 大家一起来翻译
    isParent: boolean
    // 社团为 翻译者的社团
    isChild: boolean
    // 包含特典或就是特典作品
    isTranslationBonusChild: boolean
    // 原版作品 ID
    originalWorkno: string | null
    // 原版作品对应的翻译版 ID
    parentWorkno: string | null
    // 多个不同译者的翻译版
    childWorknos: string[]
    // 翻译的语言
    lang: string | null
  }
  languageEditions: Array<{
    workId: string
    label: string
    lang: string
  }>
  subtitles: boolean
  subtitlesData?: {
    data: File
  }
  createdAt: Date
  updatedAt: Date
}

export type Work = Jsonify<ServerWork> & {
  // 以下都为非数据库字段
  exists?: boolean // 是否已收藏
};
