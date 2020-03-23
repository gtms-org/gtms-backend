import mongoose from 'mongoose'
import { testDbHelper } from '@gtms/lib-testing'

// jest.mock('@gtms/lib-logger', () => ({
//   log: jest.fn(),
// }))
console.log(process.env)
beforeAll(async () => {
  console.log(process.env)
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
