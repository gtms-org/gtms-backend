const dotenv = require('dotenv')
dotenv.config()

const {
    DB_HOST,
    QUEUE_HOST,
    VERSION,
    PORT,
    APP_DOMAIN,
    SENDGRID_API_KEY, 
    ADDRESS_EMAIL
} = process.env

module.exports = {
    port: PORT,
    dbHost: DB_HOST,
    dbName: 'groups',
    serviceName: 'groups',
    serviceVersion: VERSION,
    queueHost: QUEUE_HOST,
    appDomain: APP_DOMAIN,
    sendGridApiKey: SENDGRID_API_KEY,    
    addressEmail: ADDRESS_EMAIL
}
