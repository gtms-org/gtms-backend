import { app } from '../index'
import request from 'supertest'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'
import amqp from 'amqplib'
import config from 'config'
import { Queues } from '@gtms/commons'
import { ObjectID } from 'mongodb'

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
      .find({ code: '4ERTdo8K9tthIBE11Vxgcm9P9MK17qbnBiSPbAV4vJaphwN5cz' })
      .count()

    expect(activationCodesLen).toBe(0)
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

  it('Should generate code which will allow to change password', async done => {
    await loadFixtures()

    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => async (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())

      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('traceId')
      expect(json.data).toHaveProperty('html')
      expect(json.data).toHaveProperty('text')
      expect(json.data).toHaveProperty('to')
      expect(json.type).toBe('email')
      expect(json.data.to).toBe('test@dot.com')

      // compare traceid from http response, with the one sent to queue
      expect(json.data.traceId).toBe(traceid)

      conn.close()

      // confirm that a new activation code was saved in DB
      const activations = await testDbHelper
        .getCollection('activationcodes')
        .find({ owner: new ObjectID('5e53b8e368985486d4a50921') })
        .count()

      expect(activations).toBe(1)

      setTimeout(() => done(), 100)
    }
    // start listening for queue messages
    await amqp
      .connect(`amqp://${config.get<string>('queueHost')}`)
      .then(async conn => {
        await conn.createChannel().then(ch => {
          const ok = ch.assertQueue(Queues.notifications, { durable: true })
          ok.then(() => {
            ch.prefetch(1)
          }).then(() => {
            ch.consume(Queues.notifications, getDoCheck(conn), {
              noAck: true,
            })
          })
        })
      })

    const response = await req
      .post('/remind-password')
      .send({
        email: 'test@dot.com',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    traceid = response.header['x-traceid']
  })

  it('Should return 404 when trying to change password for not existing user', async () => {
    const response = await req
      .post('/remind-password')
      .send({
        email: 'invalid@email.com',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 400 when trying to remind password with invalid data', async () => {
    const response = await req
      .post('/remind-password')
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('message')
  })

  it('Should return 401 when trying to remind pass with blocked user', async () => {
    await loadFixtures()

    const response = await req
      .post('/remind-password')
      .send({
        email: 'block@user.com',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 401 when trying to remind pass with not active user account', async () => {
    await loadFixtures()

    const response = await req
      .post('/remind-password')
      .send({
        email: 'not@active.user.com',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should change user password', async () => {
    await loadFixtures()

    const response = await req
      .post('/reset-passord')
      .send({
        code: '5Fa1XWlbU0DhNnJrCEwcu79EKd7j7M8DFzxaJGWH2HTRZA6ANb',
        password: 'newSuperGoodPass321',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // should be possible to login with the new password
    const loginResponse = await req
      .post('/authenticate')
      .send({
        email: 'test@geotags.com',
        password: 'newSuperGoodPass321',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(loginResponse.status).toBe(201)
  })

  it('Should return 400 when trying to change password and new pass is invalid', async () => {
    const response = await req
      .post('/reset-passord')
      .send({
        code: '5Fa1XWlbU0DhNnJrCEwcu79EKd7j7M8DFzxaJGWH2HTRZA6ANb',
        password: 'wrong-pass',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 400 when trying to change password and code is invalid', async () => {
    const response = await req
      .post('/reset-passord')
      .send({
        password: 'newSuperGoodPass321',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 when trying to reset pass and there is no user in db related to sent code', async () => {
    const response = await req
      .post('/reset-passord')
      .send({
        code: '3Fa1XWlbU0DhNnJrCEwcu79EKd7j7M8DFzxaJGWH2HTRZA6ANb',
        password: 'newSuperGoodPass321',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should return 404 when trying to reset pass and code is not in the database', async () => {
    const response = await req
      .post('/reset-passord')
      .send({
        code: 'invalid-code',
        password: 'newSuperGoodPass321',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should generate delete account queue message', async done => {
    await loadFixtures()

    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => async (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())

      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('traceId')
      expect(json.data).toHaveProperty('html')
      expect(json.data).toHaveProperty('text')
      expect(json.data).toHaveProperty('to')
      expect(json.type).toBe('email')
      expect(json.data.to).toBe('test@test.com')

      // compare traceid from http response, with the one sent to queue
      expect(json.data.traceId).toBe(traceid)

      conn.close()

      setTimeout(() => done(), 100)
    }
    // start listening for queue messages
    await amqp
      .connect(`amqp://${config.get<string>('queueHost')}`)
      .then(async conn => {
        await conn.createChannel().then(ch => {
          const ok = ch.assertQueue(Queues.notifications, { durable: true })
          ok.then(() => {
            ch.prefetch(1)
          }).then(() => {
            ch.consume(Queues.notifications, getDoCheck(conn), {
              noAck: true,
            })
          })
        })
      })

    const response = await req
      .delete('/delete-account')
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    traceid = response.header['x-traceid']
  })

  it('Should return 401 from /delete-account because JWT is not in headers', async () => {
    const response = await req
      .delete('/delete-account')
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should delete user account, and related records in DB', async done => {
    await loadFixtures()

    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => async (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())

      expect(json).toHaveProperty('id')
      expect(json).toHaveProperty('traceId')
      expect(json.id).toBe('5e53b8e368985486d4a50924')
      expect(json.traceId).toBe(traceid)

      conn.close()

      //check if all related to deleted user records are not in DB anymore
      expect(
        await testDbHelper
          .getCollection('activationcodes')
          .find({ owner: new ObjectID('5e53b8e368985486d4a50924') })
          .count()
      ).toBe(0)

      expect(
        await testDbHelper
          .getCollection('users')
          .find({ email: 'delete@user.com' })
          .count()
      ).toBe(0)

      expect(
        await testDbHelper
          .getCollection('facebookproviders')
          .find({ user: new ObjectID('5e53b8e368985486d4a50924') })
          .count()
      ).toBe(0)

      expect(
        await testDbHelper
          .getCollection('refreshtokens')
          .find({ user: new ObjectID('5e53b8e368985486d4a50924') })
          .count()
      ).toBe(0)

      setTimeout(() => done(), 100)
    }
    // start listening for queue messages
    await amqp
      .connect(`amqp://${config.get<string>('queueHost')}`)
      .then(async conn => {
        await conn.createChannel().then(ch => {
          const ok = ch.assertQueue(Queues.deleteAccount, { durable: true })
          ok.then(() => {
            ch.prefetch(1)
          }).then(() => {
            ch.consume(Queues.deleteAccount, getDoCheck(conn), {
              noAck: true,
            })
          })
        })
      })

    const response = await req
      .post('/delete-account-confirm')
      .send({
        code: 'lTAbJ3OBjnP0pgbraVpv39sViExr1tRNAtX0l6hoFLPkd8Wb8fCFk4EQnQ6Z',
      })
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50924", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    traceid = response.header['x-traceid']
  })

  it('Should return 401 when trying to delete account and code does not belongs to the JWT user', async () => {
    await loadFixtures()

    const response = await req
      .post('/delete-account-confirm')
      .send({
        code: 'lTAbJ3OBjnP0pgbraVpv39sViExr1tRNAtX0l6hoFLPkd8Wb8fCFk4EQnQ6Z',
      })
      .set('Accept', 'application/json')
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

    // test response status code
    expect(response.status).toBe(401)
  })

  it('Should return 401 from /delete-account-confirm because JWT is not in headers', async () => {
    const response = await req
      .post('/delete-account-confirm')
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })
})
