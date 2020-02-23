import { app } from '../index'
import request from 'supertest'

describe('User controller', () => {
  const req = request(app)

  it('Should return amount of users', async () => {
    const response = await req.get('/users/count')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('counter')
  })

  it('Should create a user', async done => {
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

    expect(response.status).toBe(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('surname')
    expect(response.body).toHaveProperty('email')
    expect(response.body).toHaveProperty('phone')
    expect(response.body).toHaveProperty('countryCode')
    expect(response.body).toHaveProperty('languageCode')

    expect(response.body.email).toBe('test@dot.com')

    setTimeout(() => {
      done()
    }, 10)
  })
})
