import express, { Router, Request, Response } from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import logger, { stream } from '@gtms/lib-logger'
import mongoose from '@gtms/client-mongoose'
import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'
import tagsController from './controllers/tags'
import promotedController from './controllers/promoted'
import recenltyViewedController from './controllers/recentlyViewed'
import favsController from './controllers/favs'

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

router.get('/find', tagsController.find)
router.post('/suggested', JWTMiddleware, tagsController.suggested)
router.put('/promoted/group/:id', JWTMiddleware, promotedController.batchUpdate)
router.get('/promoted/group/:id', promotedController.getGroupTags)
router.post('/promoted/:id', JWTMiddleware, promotedController.update)
router.delete('/promoted/:id', JWTMiddleware, promotedController.deleteGroupTag)
router.post('/promoted', JWTMiddleware, promotedController.create)
router.post('/recent', JWTMiddleware, recenltyViewedController.create)
router.get('/recent/group/:id', JWTMiddleware, recenltyViewedController.group)
router.post('/favs', JWTMiddleware, favsController.create)
router.get('/favs/group/:id', JWTMiddleware, favsController.group)
router.delete('/favs/:id', JWTMiddleware, favsController.remove)

router.all('*', (_: Request, res: Response) => {
  res.status(404).json({ status: 'not found' })
})

app.disable('x-powered-by')
app.use(getAppInfoMiddleware())
app.use(traceIDMiddleware)
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
