import { app } from '../index'
import request from 'supertest'
import amqp from 'amqplib'
import config from 'config'
import { Queues } from '@gtms/commons'
import { testDbHelper } from '@gtms/client-mongoose/src/TestDbHelper'
import Fixtures from 'node-mongodb-fixtures'
import cookieParser from 'set-cookie-parser'

function checkCommonResponseHeaders(header: { [key: string]: string }) {
  expect(header).toHaveProperty('x-traceid')
  expect(header).toHaveProperty('x-app')
  expect(header).toHaveProperty('x-app-version')
  expect(header).not.toHaveProperty('x-powered-by')
}

describe('User controller', () => {
  const req = request(app)

  it('Should return amount of users', async () => {
    const response = await req.get('/users/count')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('counter')
  })

  it('Should create a user', async done => {
    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => (msg: amqp.Message) => {
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

      traceid = json.data.traceId
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
      .post('/users')
      .send({
        name: 'test',
        surname: 'user',
        email: 'test@dot.com',
        phone: '+48 333-222-111',
        password: 'change-me',
        countryCode: 'pl',
        languageCode: 'pl-pl',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(201)

    // test response body
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('surname')
    expect(response.body).toHaveProperty('email')
    expect(response.body).toHaveProperty('phone')
    expect(response.body).toHaveProperty('countryCode')
    expect(response.body).toHaveProperty('languageCode')
    expect(response.body.email).toBe('test@dot.com')

    // test response headers
    checkCommonResponseHeaders(response.header)

    traceid = response.header['x-traceid']

    // test DB record
    const dbUser = await testDbHelper
      .getCollection('users')
      .findOne({ email: 'test@dot.com' })

    expect(dbUser.isBlocked).toBe(false)
    expect(dbUser.isActive).toBe(false)
    expect(dbUser.name).toBe('test')
    expect(dbUser.surname).toBe('user')
    expect(dbUser.email).toBe('test@dot.com')
    expect(dbUser.countryCode).toBe('pl')
    expect(dbUser.languageCode).toBe('pl-pl')
    expect(dbUser.phone).toBe('+48 333-222-111')
  })

  it('Should responde with traceid from request', async () => {
    const response = await req
      .get('/users/count')
      .set('x-traceid', 'fake-traceid')

    expect(response.header).toHaveProperty('x-traceid')
    expect(response.header['x-traceid']).toBe('fake-traceid')
  })

  it('Should login user', async () => {
    const fixtures = new Fixtures({
      dir: `${process.cwd()}/fixtures`,
      mute: true,
    })

    await fixtures
      .connect(await testDbHelper.getConnectionString())
      .then(() => fixtures.load())
      .then(() => fixtures.disconnect())

    const response = await req
      .post('/authenticate')
      .send({
        email: 'test@dot.com',
        password: 'change-me',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(201)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')

    // test response cookies
    const [accessToken, refreshToken] = cookieParser.parse(
      response.header['set-cookie']
    )

    expect(accessToken.name).toBe('accessToken')
    expect(accessToken.value).toBe(response.body.accessToken)

    expect(refreshToken.name).toBe('refreshToken')
    expect(refreshToken.value).toBe(response.body.refreshToken)
  })

  it('Should not allow to login not-existing user', async () => {
    const response = await req
      .post('/authenticate')
      .send({
        email: 'invalid@email.com',
        password: 'change-me',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
    expect(response.header).not.toHaveProperty('set-cookie')

    // test response body
    expect(response.body).toHaveProperty('message')
  })

  it('Should not allow to login blocked user', async () => {
    const fixtures = new Fixtures({
      dir: `${process.cwd()}/fixtures`,
      mute: true,
    })

    await fixtures
      .connect(await testDbHelper.getConnectionString())
      .then(() => fixtures.load())
      .then(() => fixtures.disconnect())

    const response = await req
      .post('/authenticate')
      .send({
        email: 'block@user.com',
        password: 'change-me',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
    expect(response.header).not.toHaveProperty('set-cookie')

    // test response body
    expect(response.body).toHaveProperty('message')
  })

  it('Should not allow to login with invalid password', async () => {
    const fixtures = new Fixtures({
      dir: `${process.cwd()}/fixtures`,
      mute: true,
    })

    await fixtures
      .connect(await testDbHelper.getConnectionString())
      .then(() => fixtures.load())
      .then(() => fixtures.disconnect())

    const response = await req
      .post('/authenticate')
      .send({
        email: 'test@dot.com',
        password: 'invalid-password',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
    expect(response.header).not.toHaveProperty('set-cookie')

    // test response body
    expect(response.body).toHaveProperty('message')
  })
})
