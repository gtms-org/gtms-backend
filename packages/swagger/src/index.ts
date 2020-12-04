import express from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import { getAppInfoMiddleware } from '@gtms/lib-middlewares'
import morgan from 'morgan'
import { stream } from '@gtms/lib-logger'

const app = express()
app.disable('x-powered-by')
app.use(getAppInfoMiddleware())
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

app.use(
  '/docs',
  swaggerUi.serve,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerUi.setup(require('./docs/swagger.json'), {
    explorer: true,
  })
)

export { app }
