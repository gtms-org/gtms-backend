/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const { JWT_SECRET, VERSION, PORT, CONSUL_HOST, CONSUL_PORT } = process.env

module.exports = {
  secret: JWT_SECRET,
  serviceName: 'gatekeeper',
  serviceVersion: VERSION,
  port: PORT,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
}
