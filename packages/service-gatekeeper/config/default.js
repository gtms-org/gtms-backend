/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const { JWT_SECRET, AUTH_SERVICE_URL, VERSION, PORT } = process.env

module.exports = {
  secret: JWT_SECRET,
  serviceName: 'gatekeeper',
  serviceVersion: VERSION,
  services: {
    auth: `http://${AUTH_SERVICE_URL}`,
  },
  port: PORT,
}