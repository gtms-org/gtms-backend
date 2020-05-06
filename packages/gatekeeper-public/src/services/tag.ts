import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/tags',
  provider: config.get<string>('services.tags'),
  name: 'Tags service',
  locations: [
    {
      path: '/find',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/promoted',
      method: http.POST,
      restricted: true,
    },
  ],
}
