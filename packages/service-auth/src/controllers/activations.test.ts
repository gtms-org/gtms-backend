import { app } from '../index'
import request from 'supertest'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'

describe('Activations controller', () => {
  const req = request(app)

  it('Should activate user account', async () => {
    await loadFixtures()
    const response = await req.get(
      '/activate-account/4ERTdo8K9tthIBE11Vxgcm9P9MK17qbnBiSPbAV4vJaphwN5cz'
    )

    // test response status
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test DB record
    const dbUser = await testDbHelper
      .getCollection('users')
      .findOne({ email: 'not@active.user.com' })

    expect(dbUser.isActive).toBe(true)
    expect(dbUser.isBlocked).toBe(false)

    // activation token should have been deleted
    const activationCodesLen = await testDbHelper
      .getCollection('activationcodes')
      .estimatedDocumentCount({})

    expect(activationCodesLen).toBe(1)
  })

  it('Should return 404 when activation code is invalid', async () => {
    const response = await req.get('/activate-account/fake-activation-code')

    // test response status
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 when related to activation code user record does not exist', async () => {
    await loadFixtures()
    const response = await req.get(
      '/activate-account/3Fa1XWlbU0DhNnJrCEwcu79EKd7j7M8DFzxaJGWH2HTRZA6ANb'
    )

    // test response status
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })
})
