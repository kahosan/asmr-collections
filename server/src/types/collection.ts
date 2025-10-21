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
    id: string
    name: string
  }>
  // 画师
  illustrators: Array<{
    id: string
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
  originalId: string
  reviewCount: number
  releaseDate: string
  languageEditions: Array<{
    workId: string
    label: string
    lang: string
  }>
  subtitles?: File
  createdAt: string
  updatedAt: string
}
