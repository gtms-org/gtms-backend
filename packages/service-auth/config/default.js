/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv')
dotenv.config()

const {
  JWT_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  DB_HOST,
  QUEUE_HOST,
  APP_DOMAIN,
  USER_PROFILE_SERVICE,
  VERSION,
} = process.env

module.exports = {
  secret: JWT_SECRET,
  refreshTokenSecret: JWT_REFRESH_TOKEN_SECRET,
  port: 3333,
  tokenLife: 900,
  refreshTokenLife: 86400,
  dbHost: DB_HOST,
  dbName: 'auth',
  serviceName: 'auth',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  appDomain: APP_DOMAIN,
  services: {
    userProfile: USER_PROFILE_SERVICE,
  },
}
