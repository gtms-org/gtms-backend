import express, { Router, Request, Response } from 'express'
import bodyParser from 'body-parser'
import fileUpload from 'express-fileupload'
import morgan from 'morgan'
import logger, { stream } from '@gtms/lib-logger'
import mongoose from '@gtms/client-mongoose'
import { getCreateFileAction } from './controllers/files'
import {
  JWTMiddleware,
  errorMiddleware,
  traceIDMiddleware,
  getAppInfoMiddleware,
} from '@gtms/lib-middlewares'
import { FileTypes } from '@gtms/commons'

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

router.post('/groups/logo', getCreateFileAction(FileTypes.groupLogo))
router.post('/groups/bg', getCreateFileAction(FileTypes.groupBg))
router.post('/avatars', getCreateFileAction(FileTypes.avatar))
router.post('/gallery', getCreateFileAction(FileTypes.userGallery))

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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(
  fileUpload({
    limits: { fileSize: 4 * 1024 * 1024 },
    useTempFiles: false,
  })
)
app.use('/', router)
app.use(errorMiddleware)

export { app }
