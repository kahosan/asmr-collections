export interface WorkInfo {
  id: string
  name: string
  image_main: string
  intro: string
  // circle
  maker: {
    id: string
    name: string
  }
  // 系列
  series?: {
    id: string
    name: string
  }
  // 声优
  artists?: string[]
  // 画师
  illustrators?: string[]
  age_category: 1 | 2 | 3 // 1: 全年齢, 2: R15, 3: R18
  // tags
  genres?: Array<{
    id: number
    name: string
  }>
  price?: number // 没有就是免费
  sales?: number
  wishlist_count?: number
  rating?: number
  rating_count?: number
  rating_count_detail?: Array<{
    review_point: number
    count: number
    ratio: number
  }>
  review_count?: number
  release_date: string
  language_editions?: Array<{
    work_id: string
    label: string
    lang: string
  }>
}

export interface DLsiteResponse {
  work_name: string
  work_image: string
  title_id: string
  title_name: string
  age_category: 1 | 2 | 3 // 1: 全年齢, 2: R15, 3: R18
  price?: number
  dl_count?: number
  wishlist_count?: number
  review_count?: number
  regist_date: string
  rate_average_2dp?: number
  rate_count?: number
  rate_count_detail?: Array<{
    review_point: number
    count: number
    ratio: number
  }>
  dl_count_items?: Array<{
    workno: string
    label: string
    display_label: string
    lang: string
  }>
}
