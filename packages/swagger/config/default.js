/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const { PORT, VERSION, CONSUL_HOST, CONSUL_PORT } = process.env

module.exports = {
  port: PORT,
  serviceName: 'swagger',
  serviceVersion: VERSION,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
