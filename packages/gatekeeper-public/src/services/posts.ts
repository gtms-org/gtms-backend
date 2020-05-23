import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/posts',
  provider: config.get<string>('services.posts'),
  name: 'Posts service',
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
      path: '/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/group/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/user/:id',
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
