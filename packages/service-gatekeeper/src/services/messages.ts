import { http } from '../lib/enums'

export default {
  url: '/msg',
  provider: 'http://localhost:3000',
  name: 'Messages service',
  locations: [
    {
      path: '/users',
      method: http.POST,
      restricted: true,
    },
  ],
}
