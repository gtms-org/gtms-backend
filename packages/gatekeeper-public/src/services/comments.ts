import { http } from '@gtms/commons'

export default {
  url: '/comments',
  provider: 'comments',
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
