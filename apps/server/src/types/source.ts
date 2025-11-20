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
  release_date: Date
  translation_info: {
    is_volunteer: boolean
    // 日文原版
    is_original: boolean
    // 社团为 大家一起来翻译
    is_parent: boolean
    // 社团为 翻译者的社团
    is_child: boolean
    // 包含特典或就是特典作品
    is_translation_bonus_child: boolean
    // 原版作品 ID
    original_workno: string | null
    // 原版作品对应的翻译版 ID
    parent_workno: string | null
    // 多个不同译者的翻译版
    child_worknos: string[]
    // 翻译的语言
    lang: string | null
  }
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
  translation_info: {
    is_translation_agree: boolean
    is_volunteer: boolean
    is_original: boolean
    is_parent: boolean
    is_child: boolean
    is_translation_bonus_child: boolean
    original_workno: string | null
    parent_workno: string | null
    child_worknos: string[]
    lang: string | null
    production_trade_price_rate: number
    translation_bonus_langs: string[]
    translation_status_for_translator: string[]
  }
  dl_count_items?: Array<{
    workno: string
    label: string
    display_label: string
    lang: string
  }>
}
