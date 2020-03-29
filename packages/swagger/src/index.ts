import express, { Router, Request, Response } from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'

const app = express()

app.disable('x-powered-by')
app.use(bodyParser.json())

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
