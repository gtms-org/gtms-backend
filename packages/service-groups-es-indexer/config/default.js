/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const { QUEUE_HOST, VERSION, PORT } = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  serviceName: 'groups-es-indexer',
  serviceVersion: VERSION,
}
