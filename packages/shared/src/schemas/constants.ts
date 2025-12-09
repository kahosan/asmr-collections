export const ROOT_DEFAULT_SEARCH_VALUES = {
  order: 'desc',
  sort: 'releaseDate',
  filterOp: 'and'
} as const;

export const INDEX_DEFAULT_SEARCH_VALUES = {
  page: 1,
  limit: 20
} as const;

export const STORAGE_TYPES = {
  LOCAL: 'local',
  WEBDAV: 'webdav'
} as const;
