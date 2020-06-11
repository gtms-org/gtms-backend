/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const {
  QUEUE_HOST,
  VERSION,
  PORT,
  ES_HOST,
  ES_PORT,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  esHost: ES_HOST,
  esPort: ES_PORT,
  serviceName: 'worker-es-indexer',
  serviceVersion: VERSION,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
