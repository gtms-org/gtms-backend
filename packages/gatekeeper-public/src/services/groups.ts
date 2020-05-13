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
