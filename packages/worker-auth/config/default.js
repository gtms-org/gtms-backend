/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const {
  QUEUE_HOST,
  VERSION,
  PORT,
  DB_HOST,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  refreshTokenLife: 86400,
  serviceName: 'worker-auth',
  serviceVersion: VERSION,
  dbHost: DB_HOST,
  dbName: 'auth',
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
