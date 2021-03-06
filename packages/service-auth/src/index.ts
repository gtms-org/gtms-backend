import express, { Router, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import mongoose from '@gtms/client-mongoose'
import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'
import logger, { stream } from '@gtms/lib-logger'
import usersController from './controllers/users'
import facebookController from './controllers/facebook'
import googleController from './controllers/google'
import activationsController from './controllers/activations'
import findController from './controllers/find'
import meController from './controllers/me'
import favController from './controllers/favs'
import technicalController from './controllers/technical'

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
router.get('/users/tag', findController.byTags)
router.post('/users/username', findController.usernameExists)
router.get('/username/find', findController.findByUsername)
router.post('/username/find', findController.findByUsernames)
router.post('/users', usersController.create)
router.get('/users', findController.list)
router.get('/users/:id', usersController.getUser)

router.get('/me/groups', JWTMiddleware, meController.getGroups)
router.post('/me', JWTMiddleware, meController.updateAccount)
router.get('/me', JWTMiddleware, meController.getAccount)

router.get('/login-history', JWTMiddleware, technicalController.loginHistory)
router.get('/sessions', JWTMiddleware, technicalController.activeSessions)
router.delete('/sessions/:id', JWTMiddleware, technicalController.deleteSession)

router.get('/me/favs/groups', JWTMiddleware, favController.getMyFavGroups)
router.post('/me/favs/groups', JWTMiddleware, favController.addFavGroup)
router.delete(
  '/me/favs/groups/:id',
  JWTMiddleware,
  favController.removeFavGroup
)
router.put(
  '/me/favs/groups',
  JWTMiddleware,
  favController.bulkUpdateFavGroupsOrder
)
router.get('/me/favs/groups/status', JWTMiddleware, favController.isGroupInFavs)
router.get('/me/favs/users', JWTMiddleware, favController.getMyFavUsers)
router.delete('/me/favs/users/:id', JWTMiddleware, favController.addFavUser)
router.post('/me/favs/users', JWTMiddleware, favController.addFavUser)

router.post('/authenticate', usersController.authenticate)

router.post('/refresh-token', usersController.refreshToken)

router.post('/facebook', facebookController)

router.post('/google', googleController)

router.get('/activate-account/:code', activationsController.activateAccount)

router.post('/remind-password', activationsController.remindPassword)

router.post('/reset-password', activationsController.resetPassword)

router.post('/check-code', activationsController.checkCode)

router.get('/favs/groups/user/:id', favController.getUserFavGroups)
router.get('/favs/users/user/:id', favController.getUserFavUsers)

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

router.post('/users/find-by-ids', findController.findByIds)

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
