// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const {
  QUEUE_HOST,
  VERSION,
  PORT,
  DB_HOST,
  APP_KEY,
  INTERNAL_GATEKEEPER,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  serviceName: 'worker-tags',
  serviceVersion: VERSION,
  internalGatekeeper: INTERNAL_GATEKEEPER,
  dbHost: DB_HOST,
  dbName: 'tags',
  appKey: APP_KEY,
}
