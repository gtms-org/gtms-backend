import { http } from '@gtms/commons'

export default {
  url: '/posts',
  provider: 'posts',
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
