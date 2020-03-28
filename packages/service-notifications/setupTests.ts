import mongoose from 'mongoose'
import { testDbHelper } from '@gtms/lib-testing'
import { closeConnection } from './src/worker'

beforeAll(async () => {
  await testDbHelper.start()
})

afterAll(async done => {
  await testDbHelper.stop()
  closeConnection()
  mongoose.disconnect(() => {
    done()
  })
})

afterEach(async done => {
  await testDbHelper.cleanup()
  done()
})
