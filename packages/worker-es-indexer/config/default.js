/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const { QUEUE_HOST, VERSION, PORT, ES_HOST, ES_PORT } = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  esHost: ES_HOST,
  esPort: ES_PORT,
  serviceName: 'groups-es-indexer',
  serviceVersion: VERSION,
}
