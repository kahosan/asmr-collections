export interface BatchSSEEvents {
  start: {
    total: number
    message: string
  }
  progress: {
    id: string
    status: 'success' | 'failed' | 'processing'
    message?: string
    current: number
    total: number
    percent: number
  }
  end: {
    message: string
    stats?: {
      success: string[]
      failed: Array<{ id: string, error: string }>
    }
  }
  log: {
    type: 'info' | 'warning' | 'error'
    message: string
  }
  error: {
    message: string
    details: string
  }
}

export type BatchSSEEvent = keyof BatchSSEEvents;

export type BatchResult = BatchSSEEvents['end']['stats'];
