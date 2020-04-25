import mongoose from 'mongoose'
import config from 'config'
import logger from '@gtms/lib-logger'

const { NODE_ENV } = process.env

mongoose.set('useCreateIndex', true)

let dbCredentials = ''

if (config.has('dbUser') && config.has('dbPassword')) {
  dbCredentials = `${config.get<string>('dbUser')}:${config.get<string>(
    'dbPassword'
  )}@`
}

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

const mongooseOpts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}

if (NODE_ENV === 'test') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { testDbHelper } = require('@gtms/lib-testing')

  testDbHelper.getConnectionString().then((mongoDbURL: string) => {
    mongoose.connect(mongoDbURL, mongooseOpts)
  })
} else {
  const mongoDbURL = `mongodb://${dbCredentials}${config.get<string>(
    'dbHost'
  )}/${config.get<string>('dbName')}`
  mongoose.connect(mongoDbURL, mongooseOpts)
}

mongoose.Promise = global.Promise

export default mongoose
