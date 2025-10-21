export interface Work {
  id: string
  name: string
  cover: string
  intro: string
  // circle
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
  reviewCount: number
  originalId?: string // 如果是不同语言的版本，此为原版 ID
  releaseDate: string
  subtitles: boolean
  languageEditions: Array<{
    workId: string
    label: string
    lang: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Data<T extends string | number> { id: T, name: string }
