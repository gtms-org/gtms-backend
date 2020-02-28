import express, { Router, Request, Response } from 'express'
import { stream } from '@gtms/lib-logger'
import servicesConfigLoader from './lib/services'
import { traceIDMiddleware, errorMiddleware } from '@gtms/lib-middlewares'
import readAuthFromCookie from './middlewares/readAuthFromCookie'
import versionMiddleware from './middlewares/version'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

const app = express()
const router: Router = Router()

async function start() {
  app.use(cookieParser())
  router.get('/managment/heath', (_: Request, res: Response) => {
    res.status(200).json({
      status: 'up',
    })
  })

  await servicesConfigLoader(router)

  app.use(traceIDMiddleware)
  app.use(versionMiddleware)
  app.use(readAuthFromCookie)
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

  app.use(errorMiddleware)
}

start()

export { app }
