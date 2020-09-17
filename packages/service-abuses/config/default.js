// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const {
  DB_HOST,
  VERSION,
  PORT,
  CONSUL_HOST,
  CONSUL_PORT,
  QUEUE_HOST,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  queueHost: QUEUE_HOST,
  dbName: 'abuses',
  serviceName: 'abuses',
  serviceVersion: VERSION,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
