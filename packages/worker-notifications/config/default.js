/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const {
  QUEUE_HOST,
  VERSION,
  PORT,
  DB_HOST,
  CONSUL_HOST,
  CONSUL_PORT,
  SENDGRID_API_KEY,
  ADDRESS_EMAIL,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  serviceName: 'worker-notifications',
  serviceVersion: VERSION,
  dbHost: DB_HOST,
  dbName: 'notifications',
  addressEmail: ADDRESS_EMAIL,
  sendgridApiKey: SENDGRID_API_KEY,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
