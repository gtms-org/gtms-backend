import { IncomingMessage, ServerResponse } from 'http'

export class Handler {
  private method: Function

  constructor(method: Function) {
    this.method = method
  }

  public process(req: IncomingMessage, res: ServerResponse) {
    return this.method.apply(this, [req, res, null])
  }
}

export const createHandler = (method: Function) => new Handler(method)
