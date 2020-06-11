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
  serviceName: 'worker-groups',
  serviceVersion: VERSION,
  dbHost: DB_HOST,
  dbName: 'groups',
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
