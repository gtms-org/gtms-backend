import { app } from '../index'
import request from 'supertest'
import fetch from 'node-fetch'
import amqp from 'amqplib'
import config from 'config'
import { Queues } from '@gtms/commons'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'

jest.mock('node-fetch', () =>
  jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: jest.fn(),
    })
  )
)

describe('Facebook controller', () => {
  const req = request(app)

  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('Should register new user account by taking user info from Facebook', async done => {
    ;(fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: 'Jan Nowak',
            id: 'fake-id',
            email: 'fake@email.com',
          }),
      })
    )

    let traceid = ''

    const getDoCheck = (conn: amqp.Connection) => async (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())
      conn.close()

      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('traceId')
      expect(json.data).toHaveProperty('html')
      expect(json.data).toHaveProperty('text')
      expect(json.data).toHaveProperty('to')
      expect(json.type).toBe('email')
      expect(json.data.to).toBe('fake@email.com')

      // compare traceid from http response, with the one sent to queue
      expect(json.data.traceId).toBe(traceid)

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
      .post('/facebook')
      .send({
        accessToken: 'fake-facebook-access-token',
        id: 'fake-facebook-id',
        countryCode: 'pl',
        languageCode: 'pl-pl',
      })
      .set('Accept', 'application/json')

    traceid = response.header['x-traceid']

    // test response status code
    expect(response.status).toBe(201)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')

    // test DB record
    const dbUser = await testDbHelper
      .getCollection('users')
      .findOne({ email: 'fake@email.com' })

    expect(dbUser.isBlocked).toBe(false)
    expect(dbUser.isActive).toBe(false)
    expect(dbUser.name).toBe('Jan')
    expect(dbUser.surname).toBe('Nowak')
    expect(dbUser.email).toBe('fake@email.com')
    expect(dbUser.countryCode).toBe('pl')
    expect(dbUser.languageCode).toBe('pl-pl')

    const dbFbUser = await testDbHelper
      .getCollection('facebookproviders')
      .findOne({ id: 'fake-facebook-id' })

    expect(dbFbUser.accessToken).toBe('fake-facebook-access-token')
    expect(dbFbUser.name).toBe('Jan Nowak')
    expect(dbFbUser.id).toBe('fake-facebook-id')
  })

  it('Should login user using Facebook credentials', async () => {
    await loadFixtures()
    ;(fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: 'facebook user',
            id: 'fake-user-2',
            email: 'facebook@user.com',
          }),
      })
    )

    const response = await req
      .post('/facebook')
      .send({
        accessToken: 'fake-fb-token-2',
        id: 'fake-user-2',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(201)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
  })

  it('Should not allow to login with Facebook as account is blocked', async () => {
    await loadFixtures()
    ;(fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: 'facebook user',
            id: 'fake-blocked-user',
            email: 'facebook-blocked@user.com',
          }),
      })
    )

    const response = await req
      .post('/facebook')
      .send({
        accessToken: 'fake-fb-blocked-token',
        id: 'fake-blocked-user',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should not allow to login with Facebook as account is not active', async () => {
    await loadFixtures()
    ;(fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: 'facebook user',
            id: 'fake-not-active-user',
            email: 'facebook-not-active@user.com',
          }),
      })
    )

    const response = await req
      .post('/facebook')
      .send({
        accessToken: 'fake-fb-not-active-token',
        id: 'fake-not-active-user',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(403)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })
})
