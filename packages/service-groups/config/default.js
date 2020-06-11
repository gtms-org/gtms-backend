// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv')
dotenv.config()

const {
  DB_HOST,
  QUEUE_HOST,
  VERSION,
  PORT,
  APP_DOMAIN,
  INTERNAL_GATEKEEPER,
  APP_KEY,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'groups',
  serviceName: 'groups',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  internalGatekeeper: INTERNAL_GATEKEEPER,
  appKey: APP_KEY,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
