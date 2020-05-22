import mongoose from 'mongoose'
import { testDbHelper } from '@gtms/lib-testing'

beforeAll(async () => {
  await testDbHelper.start()
})

afterAll(async done => {
  await testDbHelper.stop()
  mongoose.disconnect(() => {
    done()
  })
})

afterEach(async done => {
  await testDbHelper.cleanup()
  done()
})
