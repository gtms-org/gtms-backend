// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const {
  DB_HOST,
  QUEUE_HOST,
  VERSION,
  PORT,
  APP_DOMAIN,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'comments',
  serviceName: 'comments',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
