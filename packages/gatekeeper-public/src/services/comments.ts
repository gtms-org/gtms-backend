import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/comments',
  provider: config.get<string>('services.comments'),
  name: 'Comments service',
  locations: [
    {
      path: '/',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/:id',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/:id/nested',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/post/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/my',
      method: http.GET,
      restricted: true,
    },
  ],
}
