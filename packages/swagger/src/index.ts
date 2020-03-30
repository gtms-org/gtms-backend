import express from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'

const app = express()
app.disable('x-powered-by')
app.use(bodyParser.json())

app.use(
  '/',
  swaggerUi.serve,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerUi.setup(require('./docs/swagger.json'), {
    explorer: true,
  })
)

export { app }
