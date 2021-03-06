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
  DB_NAME,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: DB_NAME,
  serviceName: 'posts',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
