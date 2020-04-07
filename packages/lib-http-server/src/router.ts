import { createHandler, Handler } from './handler'
import { IncomingMessage, ServerResponse } from 'http'
import parser from 'url'

let handlers: {
  [url: string]: Handler
} = {}

export const clear = () => {
  handlers = {}
}

export const register = (url: string, method: Function) => {
  handlers[url] = createHandler(method)
}

export const missing = (req: IncomingMessage) => {
  const url = parser.parse(req.url, true)

  return createHandler(function(_: IncomingMessage, res: ServerResponse) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.write(`No route registered for ${url.pathname}`)
    res.end()
  })
}

export const route = (req: IncomingMessage) => {
  const url = parser.parse(req.url, true)
  const handler = handlers[url.pathname]

  if (!handler) {
    return missing(req)
  }

  return handler
}
