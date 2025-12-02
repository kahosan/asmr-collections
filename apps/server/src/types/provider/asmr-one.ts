export interface Recommender {
  works: Array<{
    id: number
    title: string
    circle_id: number
    name: string
    nsfw: boolean
    release: string
    dl_count: number
    price: number
    review_count: number
    rate_count: number
    rate_average_2dp: number
    rate_count_detail: Array<{
      review_point: number
      count: number
      ratio: number
    }>
    rank?: Array<{
      term: string
      category: string
      rank: number
      rank_date: string
    }>
    has_subtitle: boolean
    create_date: string
    vas: Array<{
      id: string
      name: string
    }>
    tags: Array<{
      id: number
      i18n: {
        'en-us': {
          name: string
          history?: Array<{
            name: string
            deprecatedAt: number
          }>
          censored?: string
        }
        'ja-jp': {
          name: string
          censored?: string
        }
        'zh-cn': {
          name: string
          history?: Array<{
            name: string
            deprecatedAt: number
          }>
          censored?: string
        }
      }
      name: string
      upvote: number
      downvote: number
      voteRank: number
      voteStatus: number
    }>
    language_editions: Array<{
      lang: string
      label: string
      workno: string
      edition_id: number
      edition_type: string
      display_order: number
    }> | Record<string, unknown>
    original_workno: string | null
    other_language_editions_in_db: Array<{
      id: number
      lang: string
      title: string
      source_id: string
      is_original: boolean
      source_type: string
    }>
    translation_info: {
      lang: string | null
      is_child: boolean
      is_parent: boolean
      is_original: boolean
      is_volunteer: boolean
      child_worknos: string[]
      parent_workno: string | null
      original_workno: string | null
      is_translation_agree: boolean
      is_translation_bonus_child: boolean
    }
    work_attributes: string
    age_category_string: string
    duration: number
    source_type: string
    source_id: string
    source_url: string
    userRating: number | null
    playlistStatus: Record<string, unknown>
    circle: {
      id: number
      name: string
      source_id: string
      source_type: string
    }
    samCoverUrl: string
    thumbnailCoverUrl: string
    mainCoverUrl: string
  }>
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
  }
}
