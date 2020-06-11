// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const {
  DB_HOST,
  VERSION,
  PORT,
  INTERNAL_GATEKEEPER,
  APP_KEY,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'tags',
  serviceName: 'tags',
  serviceVersion: VERSION,
  internalGatekeeper: INTERNAL_GATEKEEPER,
  appKey: APP_KEY,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
