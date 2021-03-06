import express, { Router, Request, Response } from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import logger, { stream } from '@gtms/lib-logger'
import mongoose from '@gtms/client-mongoose'
import postsController from './controllers/post'
import findController from './controllers/find'
import favsController from './controllers/favs'

import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'

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

// routes
router.post('/find-by-ids', findController.findByIds)
router.get('/find', findController.findByTag)
router.get('/group/:id', findController.groupPosts)
router.post('/user/:id', findController.userPosts)
router.get('/user/:id/details', findController.userDetails)
router.post('/my', JWTMiddleware, findController.myPosts)
router.get('/my/details', JWTMiddleware, findController.myPostsDetails)

router.post('/:id/favs', JWTMiddleware, favsController.addToFavs)
router.delete('/:id/favs', JWTMiddleware, favsController.removeFromFavs)
router.get('/:id/favs', favsController.postFavs)
router.get('/my/favs', JWTMiddleware, favsController.removeFromFavs)

router.post('/', JWTMiddleware, postsController.create)
router.get('/:id', postsController.show)
router.post('/:id', JWTMiddleware, postsController.update)

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
