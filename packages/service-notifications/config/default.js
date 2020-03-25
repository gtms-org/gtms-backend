/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const {
  DB_HOST,
  QUEUE_HOST,
  SENDGRID_API_KEY,
  ADDRESS_EMAIL,
  VERSION,
  PORT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'notifications',
  queueHost: QUEUE_HOST,
  serviceName: 'notifications',
  serviceVersion: VERSION,
  addressEmail: ADDRESS_EMAIL,
  sendgridApiKey: SENDGRID_API_KEY,
}
