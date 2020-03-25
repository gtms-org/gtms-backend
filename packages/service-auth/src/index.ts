import express, { Router, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import usersController from './controllers/users'
import mongoose from '@gtms/client-mongoose'
import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'
import logger, { stream } from '@gtms/lib-logger'
import facebookController from './controllers/facebook'
import activationsController from './controllers/activations'
console.log(process.env)
const app = express()
const router: Router = Router()
const startTime: Date = new Date()

mongoose.connection.on('error', err => {
  logger.error(`${err}`)
  process.exit(1)
})

router.get('/managment/heath', (_: Request, res: Response) => {
  res.status(200).json({
    startTime,
    status: 'up',
  })
})

router.get('/users/count', usersController.count)
router.post('/users', usersController.create)

router.post('/authenticate', usersController.authenticate)

router.post('/refresh-token', usersController.refreshToken)

router.post('/facebook', facebookController)

router.get('/activate-account/:code', activationsController.activateAccount)

router.post('/remind-password', activationsController.remindPassword)

router.post('/reset-passord', activationsController.resetPassword)

router.delete(
  '/delete-account',
  JWTMiddleware,
  activationsController.generateDeleteAccountMail
)

router.post(
  '/delete-account-confirm',
  JWTMiddleware,
  activationsController.deleteAccount
)

router.all('*', (_: Request, res: Response) => {
  res.status(404).json({ status: 'not found' })
})
app.disable('x-powered-by')
app.use(traceIDMiddleware)
app.use(getAppInfoMiddleware())
app.use(cookieParser())
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

export { app }
