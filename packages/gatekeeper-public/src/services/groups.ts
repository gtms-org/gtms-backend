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
    {
      path: '/:slug/join',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/:slug/leave',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/:slug/members',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/:slug/admins',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/:slug/admins',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/:slug/admins/:user',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/:slug',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/:slug',
      method: http.POST,
      restricted: true,
    },
  ],
}
