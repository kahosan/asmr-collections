export interface ErrorData {
  [key: string]: unknown
  detail?: string
}

export class HTTPError<S extends number = number> extends Error {
  status: S;
  data?: ErrorData;
  constructor(message: string, status: S, data?: ErrorData) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.data = data;
  }
}
