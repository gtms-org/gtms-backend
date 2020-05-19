// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const {
  DB_HOST,
  QUEUE_HOST,
  VERSION,
  PORT,
  APP_DOMAIN,
  INTERNAL_GATEKEEPER,
  APP_KEY,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'posts',
  serviceName: 'posts',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  internalGatekeeper: INTERNAL_GATEKEEPER,
  appKey: APP_KEY,
}
