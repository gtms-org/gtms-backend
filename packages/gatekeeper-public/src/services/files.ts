import { http } from '@gtms/commons'

export default {
  url: '/files',
  provider: 'files',
  name: 'Files service',
  locations: [
    {
      path: '/groups/logo',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/groups/bg',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/group/cover',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/avatar',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/gallery',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/tags/promoted',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/post/image',
      method: http.POST,
      restricted: true,
    },
  ],
}
