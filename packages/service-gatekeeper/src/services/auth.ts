import { http } from '@gtms/commons'

export default {
  url: '/auth',
  provider: 'http://gtms-auth-service',
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
  ],
}
