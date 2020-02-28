import { http } from '../lib/enums'

export default {
  url: '/user-profile',
  provider: 'http://gtms-polrock-user-profile-service',
  name: 'Auth service',
  locations: [
    {
      path: '/',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/edit',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/',
      method: http.DELETE,
      restricted: true,
    },
  ],
}
