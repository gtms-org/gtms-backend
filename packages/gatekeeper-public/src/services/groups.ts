import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/groups',
  provider: config.get<string>('services.groups'),
  name: 'Groups service',
  locations: [
    {
      path: '/',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/',
      method: http.GET,
      restricted: false,
    },
  ],
}
