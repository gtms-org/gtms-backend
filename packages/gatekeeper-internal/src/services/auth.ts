import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/auth',
  provider: config.get<string>('services.auth'),
  name: 'Auth service',
  locations: [
    {
      path: '/users/find-by-ids',
      method: http.POST,
    },
  ],
}
