import { app } from '../index'
import request from 'supertest'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'
import { ObjectID } from 'mongodb'

describe('WebPushSubscriptions controller', () => {
  const req = request(app)

  it('Should subscribe for notifications', async () => {
    const response = await req
      .post('/web-push')
      .send({
        subscription: '0ljDj0xHIfptCVyMzNv2YRXq05MjdSqPP93RneY6aC06ao4Cj1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
      })
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50922", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(201)

    // test response body
    expect(response.body).toHaveProperty('hash')

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test DB record
    const dbSubscription = await testDbHelper
      .getCollection('webpushsubscriptions')
      .findOne({
        subscription: '0ljDj0xHIfptCVyMzNv2YRXq05MjdSqPP93RneY6aC06ao4Cj1',
      })

    expect(dbSubscription.subscription).toBe(
      '0ljDj0xHIfptCVyMzNv2YRXq05MjdSqPP93RneY6aC06ao4Cj1'
    )

    expect(dbSubscription.hash).toBe('a71e18ab8b9b55b3def8887c8c52bb99')
  })

  it('Should return validation error when subscription is not provided', async () => {
    const response = await req
      .post('/web-push')
      .send({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
      })
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('subscription')
  })

  it('Should return validation error when user agent is not provided', async () => {
    const response = await req
      .post('/web-push')
      .send({
        subscription: 'GGXEV7KIj47h3R5uWV6RGyeye6nDXit2sTD0TxDfHnx93z33k2',
      })
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('userAgent')
  })

  it('Should responde with traceid from request', async () => {
    const response = await req.get('/').set('x-traceid', 'fake-traceid')

    expect(response.header).toHaveProperty('x-traceid')
    expect(response.header['x-traceid']).toBe('fake-traceid')
  })

  it('Should not allow to create subscription if JWT is not present in request headers', async () => {
    const response = await req
      .post('/web-push')
      .send({
        subscription: 'GGXEV7KIj47h3R5uWV6RGyeye6nDXit2sTD0TxDfHnx93z33k2',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should not allow to create subscription if it already exists in DB', async () => {
    await loadFixtures()

    const response = await req
      .post('/web-push')
      .send({
        subscription: '4ERTdo8K9tthIBE11Vxgcm9P9MK17qbnBiSPbAV4vJaphwN5cz',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
      })
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 as subscription hash is not in DB', async () => {
    const response = await req
      .get('/web-push/fdfrc59gre16df99b53a3ea7d2589def')
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 as subscription does not belong to the current user', async () => {
    await loadFixtures()

    const response = await req
      .get('/web-push/fe6fc59315167599b53a3ea7d2589def')
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 200 as subscription exists and belongs to the current user', async () => {
    await loadFixtures()

    const response = await req
      .get('/web-push/xh1M7wFef8HajczGyxxz2lOBpNxu1bIS')
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('hash')
    expect(response.body).toHaveProperty('userAgent')
  })

  it('Should delete subscription as hash exists in DB and belongs to the current user', async () => {
    await loadFixtures()

    // make sure that record is in DB
    const beforeLen = await testDbHelper
      .getCollection('webpushsubscriptions')
      .count({ owner: new ObjectID('5e53b8e368985486d4a50921') })

    expect(beforeLen).toBe(1)

    const response = await req
      .delete('/web-push/xh1M7wFef8HajczGyxxz2lOBpNxu1bIS')
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // check if record has been deleted from DB

    const afterLen = await testDbHelper
      .getCollection('webpushsubscriptions')
      .count({ owner: new ObjectID('5e53b8e368985486d4a50921') })

    expect(afterLen).toBe(0)
  })

  it('Should return 404 when deleting not existing subscription', async () => {
    const response = await req
      .delete('/web-push/xh1M7wFef8HajczGyxxz2lOBpNxu1bIS')
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 when deleting subscription that does not belongs to the current user', async () => {
    await loadFixtures()

    const response = await req
      .delete('/web-push/xh1M7wFef8HajczGyxxz2lOBpNxu1bIS')
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50922", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })
})
