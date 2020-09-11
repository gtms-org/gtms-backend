/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const {
  JWT_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  DB_HOST,
  QUEUE_HOST,
  APP_DOMAIN,
  VERSION,
  PORT,
  CONSUL_HOST,
  CONSUL_PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL,
} = process.env

module.exports = {
  secret: JWT_SECRET,
  refreshTokenSecret: JWT_REFRESH_TOKEN_SECRET,
  port: PORT,
  tokenLife: 900,
  refreshTokenLife: 86400,
  dbHost: DB_HOST,
  dbName: 'auth',
  serviceName: 'auth',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
  googleClientId: GOOGLE_CLIENT_ID,
  googleClientSecret: GOOGLE_CLIENT_SECRET,
  googleRedirectUrl: GOOGLE_REDIRECT_URL,
}
