// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  serviceName: 'worker-tags',
  serviceVersion: VERSION,
  dbHost: DB_HOST,
  dbName: 'tags',
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
