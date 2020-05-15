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
      restricted: false,
    },
    {
      path: '/promoted/group/:id',
      method: http.PUT,
      restricted: true,
    },
    {
      path: '/promoted/:id',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/promoted/:id',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/promoted',
      method: http.POST,
      restricted: true,
    },
  ],
}
