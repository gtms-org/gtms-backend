// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

appKey

const { DB_HOST, VERSION, PORT, INTERNAL_GATEKEEPER, APP_KEY } = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'tags',
  serviceName: 'tags',
  serviceVersion: VERSION,
  appDomain: APP_DOMAIN,
  internalGatekeeper: INTERNAL_GATEKEEPER,
  appKey: APP_KEY,
}
