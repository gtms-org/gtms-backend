import express, { Router, Request, Response } from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import logger, { stream } from '@gtms/lib-logger'
import mongoose from '@gtms/client-mongoose'
import webPushSubscriptionsController from './controllers/webPushSubscriptions'
import notificationsSettingsController from './controllers/notificationsSettings'
import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'

import { listenToNotificationQueue } from './worker'

const app = express()
const router: Router = Router()

mongoose.connection.on('error', err => {
  logger.error(`${err}`)
  process.exit(1)
})

router.get('/managment/heath', (_: Request, res: Response) => {
  res.status(200).json({
    status: 'up',
  })
})

router.post('/web-push/check', webPushSubscriptionsController.checkIfExists)
router.post('/web-push', webPushSubscriptionsController.create)
router.delete('/web-push', webPushSubscriptionsController.deleteSubscription)
router.post('/settings', notificationsSettingsController.updateMySettings)
router.get('/settings', notificationsSettingsController.mySettings)

router.all('*', (_: Request, res: Response) => {
  res.status(404).json({ status: 'not found' })
})

app.disable('x-powered-by')
app.use(getAppInfoMiddleware())
app.use(traceIDMiddleware)
app.use(JWTMiddleware)
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
app.use(bodyParser.json())
app.use('/', router)
app.use(errorMiddleware)

listenToNotificationQueue()

export { app }
