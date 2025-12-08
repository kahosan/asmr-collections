/* eslint-disable @typescript-eslint/no-explicit-any -- generic error class */
export class HTTPError<S extends number = number> extends Error {
  status: S;
  data?: any;
  constructor(message: string, status: S, data?: any) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.data = data;
  }
}
