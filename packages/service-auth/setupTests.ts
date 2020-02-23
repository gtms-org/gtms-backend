import mongoose from 'mongoose'
import config from 'config'

beforeEach(done => {
  function clearDB() {
    for (const i in mongoose.connection.collections) {
      mongoose.connection.collections[i].deleteMany(function() {})
    }
    return done()
  }

  if (mongoose.connection.readyState === 0) {
    let dbCredentials = ''

    if (config.has('dbUser') && config.has('dbPassword')) {
      dbCredentials = `${config.get<string>('dbUser')}:${config.get<string>(
        'dbPassword'
      )}@`
    }
    const mongoDbURL = `mongodb://${dbCredentials}${config.get<string>(
      'dbHost'
    )}/${config.get<string>('dbName')}`
    mongoose.connect(mongoDbURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }, function(err) {
      if (err) {
        throw err
      }
      return clearDB()
    })
  } else {
    return clearDB()
  }
})

afterEach(done => {
  mongoose.disconnect(done)
})
