/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const {
  DB_HOST,
  QUEUE_HOST,
  VERSION,
  PORT,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'notifications',
  queueHost: QUEUE_HOST,
  serviceName: 'notifications',
  serviceVersion: VERSION,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
