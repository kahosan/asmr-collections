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
    type: BatchLogType
    message: string
  }
  error: {
    message: string
    details: string
  }
}

export type BatchLogType = 'info' | 'warning' | 'error';

export type BatchSSEEvent = keyof BatchSSEEvents;

export type BatchSSEData = {
  [K in BatchSSEEvent]: {
    id: string
    event: K
    data: BatchSSEEvents[K]
  }
}[BatchSSEEvent];

export type BatchSendEventFn = <K extends BatchSSEEvent>(event: K, data: BatchSSEEvents[K]) => Promise<void>;

export type BatchResult = BatchSSEEvents['end']['stats'];
