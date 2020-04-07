import { register, route } from '@gtms/lib-http-server'
import http, { IncomingMessage, ServerResponse } from 'http'
import { listenToGroupsQueue } from './worker'

listenToGroupsQueue()

register('/managment/heath', (_: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write('{"status": "up"}')
  res.end()
})

export const server = http.createServer((req, res) => {
  const handler = route(req)
  handler.process(req, res)
})
