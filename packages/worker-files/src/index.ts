import { register, route } from '@gtms/lib-http-server'
import mongoose from '@gtms/client-mongoose'
import http, { IncomingMessage, ServerResponse } from 'http'
import logger from '@gtms/lib-logger'
import { startWorkers } from './workers'
import { initCronJobs } from './cronJobs'

mongoose.connection.on('error', err => {
  logger.error(`${err}`)
  process.exit(1)
})

startWorkers()
initCronJobs()

register('/managment/heath', (_: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write('{"status": "up"}')
  res.end()
})

export const server = http.createServer((req, res) => {
  const handler = route(req)
  handler.process(req, res)
})
