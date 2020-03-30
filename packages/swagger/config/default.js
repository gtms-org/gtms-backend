/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const { PORT, VERSION } = process.env

module.exports = {
  port: PORT,
  serviceName: 'swagger',
  serviceVersion: VERSION,
}
