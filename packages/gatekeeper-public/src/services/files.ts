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
      timeout: 30000, // 30s
    },
    {
      path: '/groups/bg',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/groups/cover',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/avatar',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/gallery',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/tags/promoted',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/posts/image',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/tmp/tags/promoted',
      method: http.POST,
      restricted: true,
      timeout: 30000, // 30s
    },
    {
      path: '/tmp/:id',
      method: http.DELETE,
      restricted: true,
    },
  ],
}
