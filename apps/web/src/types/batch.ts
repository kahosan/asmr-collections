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
    type: LogType
    message: string
  }
  error: {
    message: string
    details: string
  }
}

export type LogType = 'info' | 'warning' | 'error';

export type SSEData = {
  [K in keyof BatchSSEEvents]: {
    id: string
    event: K
    data: BatchSSEEvents[K]
  }
}[keyof BatchSSEEvents];

export type SSEEvent = keyof BatchSSEEvents;
