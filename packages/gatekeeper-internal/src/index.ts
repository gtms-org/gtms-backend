import express, { Router, Request, Response } from 'express'
import { stream } from '@gtms/lib-logger'
import {
  initRouter,
  getAppKeyAuthMiddleware,
  versionMiddleware,
} from '@gtms/lib-gatekeeper'
import { traceIDMiddleware } from '@gtms/lib-middlewares'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import config from 'config'
import services from './services'

const app = express()
const router: Router = Router()

async function start() {
  app.use(cookieParser())
  router.get('/managment/heath', (_: Request, res: Response) => {
    res.status(200).json({
      status: 'up',
    })
  })

  initRouter(router, services)

  app.use(traceIDMiddleware)
  app.use(versionMiddleware)
  app.use(
    getAppKeyAuthMiddleware(config.get<{ [key: string]: string }>('appKeys'))
  )
  app.disable('x-powered-by')
  app.use(
    morgan(
      (tokens, req, res) => {
        return [
          res.get('x-traceid'),
          tokens.method(req, res),
          tokens.url(req, res),
          tokens.status(req, res),
          tokens.res(req, res, 'content-length'),
          '-',
          tokens['response-time'](req, res),
          'ms',
        ].join(' ')
      },
      { stream }
    )
  )
  app.use('/v1', router)

  router.all('*', (_: Request, res: Response) => {
    res.status(404).json({ status: 'not found' })
  })
}

start()

export { app }
