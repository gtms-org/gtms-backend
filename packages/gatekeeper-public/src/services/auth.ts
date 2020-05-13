import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/auth',
  provider: config.get<string>('services.auth'),
  name: 'Auth service',
  locations: [
    {
      path: '/users/count',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/users',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/users',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/authenticate',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/refresh-token',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/facebook',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/activate-account/:code',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/remind-password',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/reset-passord',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/delete-account',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/delete-account-confirm',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/me/favs/groups',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/me/favs/groups',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/me/groups',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/me',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/me',
      method: http.GET,
      restricted: true,
    },
  ],
}
