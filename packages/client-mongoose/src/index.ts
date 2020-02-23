import mongoose from 'mongoose'
import config from 'config'
import logger from '@gtms/lib-logger'

mongoose.set('useCreateIndex', true)

let dbCredentials = ''

if (config.has('dbUser') && config.has('dbPassword')) {
  dbCredentials = `${config.get<string>('dbUser')}:${config.get<string>(
    'dbPassword'
  )}@`
}

const mongoDbURL = `mongodb://${dbCredentials}${config.get<string>(
  'dbHost'
)}/${config.get<string>('dbName')}`
const db = mongoose.connection
db.on('error', err => {
  logger.log({
    message: `Database error: ${err}`,
    level: 'error',
  })
})
db.once('open', function() {
  logger.log({
    message: 'Connection with mongoDB established',
    level: 'info',
  })
})

mongoose.connect(mongoDbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
mongoose.Promise = global.Promise

export default mongoose
