import { app } from '../index'
import request from 'supertest'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'
import amqp from 'amqplib'
import { Queues } from '@gtms/commons'
import config from 'config'

describe('Group controller', () => {
  const req = request(app)

  it('Should create a group', async done => {
    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())

      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('traceId')
      expect(json.data).toHaveProperty('name')
      expect(json.data).toHaveProperty('slug')
      expect(json.data).toHaveProperty('type')
      expect(json.data).toHaveProperty('visibility')
      expect(json.data).toHaveProperty('tags')
      expect(json.data).toHaveProperty('members')
      expect(json.data).toHaveProperty('owner')

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
          const ok = ch.assertQueue(Queues.updateESIndex, { durable: true })
          ok.then(() => {
            ch.prefetch(1)
          }).then(() => {
            ch.consume(Queues.updateESIndex, getDoCheck(conn), {
              noAck: true,
            })
          })
        })
      })

    const response = await req
      .post('/')
      .send({
        name: 'Test group',
        description: 'Lorem ipsum',
        type: 'default',
        visibility: 'public',
      })
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50922", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(201)

    // test response body
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('description')

    expect(response.body.name).toBe('Test group')
    expect(response.body.slug).toBe('test-group')
    expect(response.body.description).toBe('Lorem ipsum')
    expect(response.body.type).toBe('default')
    expect(response.body.visibility).toBe('public')

    // test response headers
    checkCommonResponseHeaders(response.header)

    traceid = response.header['x-traceid']

    // test DB record
    const dbGroup = await testDbHelper
      .getCollection('groups')
      .findOne({ slug: 'test-group' })

    expect(dbGroup.name).toBe('Test group')
    expect(dbGroup.slug).toBe('test-group')
    expect(dbGroup.description).toBe('Lorem ipsum')
    expect(dbGroup.type).toBe('default')
    expect(dbGroup.visibility).toBe('public')
  })

  it('Should return validation errors when group name is too short', async () => {
    const response = await req
      .post('/')
      .send({
        name: 'AB',
        description: 'Lorem ipsum',
        type: 'default',
        visibility: 'public',
      })
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('name')
  })

  it('Should not allow to create a group with already existing name in DB', async () => {
    await loadFixtures()

    const response = await req
      .post('/')
      .send({
        name: 'Brudstoock',
        description: 'Lorem ipsum',
        type: 'default',
        visibility: 'public',
      })
      .set('Accept', 'application/json')
      .set(
        'x-access-token',
        '{"id": "5e53b8e368985486d4a50921", "email": "test@test.com"}'
      )

    // test response status code
    expect(response.status).toBe(400)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body).toHaveProperty('name')
  })

  it('Should responde with traceid from request', async () => {
    const response = await req.get('/').set('x-traceid', 'fake-traceid')

    expect(response.header).toHaveProperty('x-traceid')
    expect(response.header['x-traceid']).toBe('fake-traceid')
  })

  it('Should return info about group', async () => {
    await loadFixtures()

    const response = await req
      .get('/brudstoock')
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(200)

    // test response headers
    checkCommonResponseHeaders(response.header)

    // test response body
    expect(response.body.name).toBe('Brudstoock')
    expect(response.body.slug).toBe('brudstoock')
    expect(response.body.description).toBe('Lorem ipsum')
    expect(response.body.type).toBe('default')
    expect(response.body.visibility).toBe('public')
  })

  it('Should return 404 if group does not exist in database', async () => {
    const response = await req
      .get('/not-exist')
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(404)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should not allow to update group if user is not logged', async () => {
    await loadFixtures()

    const response = await req
      .post('/brudstoock')
      .send({
        name: 'Brudstoock change',
      })
      .set('Accept', 'application/json')

    // test response status code
    expect(response.status).toBe(401)

    // test response headers
    checkCommonResponseHeaders(response.header)
  })

  it('Should not allow to update group if user is not the owner', async () => {
    await loadFixtures()

    const response = await req
      .post('/brudstoock')
      .send({
        name: 'Brudstoock change',
      })
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

  it('Should update group', async done => {
    await loadFixtures()

    let traceid = ''
    const getDoCheck = (conn: amqp.Connection) => (msg: amqp.Message) => {
      // test the message sent to the queue
      const json = JSON.parse(msg.content.toString())

      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('traceId')
      expect(json.data).toHaveProperty('name')
      expect(json.data).toHaveProperty('slug')
      expect(json.data).toHaveProperty('type')
      expect(json.data).toHaveProperty('visibility')
      expect(json.data).toHaveProperty('tags')
      expect(json.data).toHaveProperty('members')
      expect(json.data).toHaveProperty('owner')

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
          const ok = ch.assertQueue(Queues.updateESIndex, { durable: true })
          ok.then(() => {
            ch.prefetch(1)
          }).then(() => {
            ch.consume(Queues.updateESIndex, getDoCheck(conn), {
              noAck: true,
            })
          })
        })
      })

    const response = await req
      .post('/opener')
      .send({
        name: 'Jarocin',
      })
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

    // test db record
    const dbGroup = await testDbHelper
      .getCollection('groups')
      .findOne({ slug: 'jarocin' })

    expect(dbGroup.name).toBe('Jarocin')
  })
})
