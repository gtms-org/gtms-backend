// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const { DB_HOST, VERSION, PORT, CONSUL_HOST, CONSUL_PORT } = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'tags',
  serviceName: 'tags',
  serviceVersion: VERSION,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
