import type { Work } from './work';

export interface WorksResponse {
  page: number
  limit: number
  total: number
  data: Work[]
}
