const dotenv = require('dotenv')
dotenv.config()

const { DB_HOST, QUEUE_HOST, VERSION, PORT, APP_DOMAIN } = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'groups',
  serviceName: 'groups',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
}
