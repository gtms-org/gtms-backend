import { app } from '../index'
import request from 'supertest'
import {
  testDbHelper,
  loadFixtures,
  checkCommonResponseHeaders,
} from '@gtms/lib-testing'

describe('Group controller', () => {
  const req = request(app)

  it('Should create a group', async () => {
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
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

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
      .set('x-access-token', '{"id": "fake-id", "email": "test@test.com"}')

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
})
