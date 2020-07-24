import { http } from '@gtms/commons'

export default {
  url: '/auth',
  provider: 'auth',
  name: 'Auth service',
  locations: [
    {
      path: '/users/count',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/users/username',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/tag',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/username/find',
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
      path: '/users/:id',
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
      path: '/reset-password',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/check-code',
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
    {
      path: '/me/favs/groups/:id',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/me/favs/groups',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/me/favs/groups',
      method: http.PUT,
      restricted: true,
    },
    {
      path: '/me/favs/users',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/me/favs/posts',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/favs/groups/:id',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/favs/groups',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/favs/groups/user/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/favs/users/user/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/favs/posts/user/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/favs/posts/:id',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/favs/posts',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/favs/users/:id',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/favs/users',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/login-history',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/sessions',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/sessions/:id',
      method: http.DELETE,
      restricted: true,
    },
  ],
}
