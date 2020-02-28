import express, { Router, Request, Response } from 'express'
import logger, { stream } from '@gtms/lib-logger'
import servicesConfigLoader from './lib/services'
import {
  traceIDMiddleware,
  errorMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'
import readAuthFromCookie from './middlewares/readAuthFromCookie'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

const app = express()
const router: Router = Router()
const port = process.env.PORT || 3010
let startTime: Date

async function start() {
  app.use(cookieParser())
  router.get('/managment/heath', (_: Request, res: Response) => {
    res.status(200).json({
      startTime,
      status: 'up',
    })
  })

  await servicesConfigLoader(router)

  app.use(traceIDMiddleware)
  app.use(getAppInfoMiddleware())
  app.use(readAuthFromCookie)
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
  app.use(errorMiddleware)

  router.all('*', (_: Request, res: Response) => {
    res.status(404).json({ status: 'not found' })
  })

  app.listen(port, () => {
    logger.info(`Gatekeeper started on port ${port}`)
    startTime = new Date()
  })
}

start()
