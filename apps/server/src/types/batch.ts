export interface BatchSSEEvents {
  start: {
    total: number
    message: string
  }
  progress: {
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

export type SendEventFn = <K extends BatchSSEEvent>(event: K, data: BatchSSEEvents[K]) => Promise<void>;

export type BatchSSEEvent = keyof BatchSSEEvents;

export type BatchResult = BatchSSEEvents['end']['stats'];
