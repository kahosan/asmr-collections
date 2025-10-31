export interface Work {
  id: string
  name: string
  cover: string
  intro: string
  // circle
  circleId: string
  circle: {
    id: string
    name: string
  }
  // 系列
  seriesId: string | null
  series: {
    id: string
    name: string
  } | null
  // 声优
  artists: Array<{
    id: number
    name: string
  }>
  // 画师
  illustrators: Array<{
    id: number
    name: string
  }>
  ageCategory: 1 | 2 | 3 // 1: 全年齢, 2: R15, 3: R18
  // tags
  genres: Array<{
    id: number
    name: string
  }>
  price: number
  sales: number
  wishlistCount: number
  rate: number
  rateCount: number
  originalId: string | null
  reviewCount: number
  releaseDate: string
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
  subtitles?: File
  createdAt: string
  updatedAt: string
}

export type WorkInfoResp = Omit<Work, 'artists' | 'illustrators' | 'createdAt' | 'updatedAt'> & {
  artists: Array<{
    id: number | null
    name: string
  }>
  illustrators: Array<{
    id: number | null
    name: string
  }>
};
