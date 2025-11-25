import type { ServerWork, Work } from '../work';

export type WorkInfoResponse<T extends ServerWork | Work> = Omit<T, 'createdAt' | 'updatedAt'>;

export interface WorksResponse {
  page: number
  limit: number
  total: number
  data: Work[]
}
