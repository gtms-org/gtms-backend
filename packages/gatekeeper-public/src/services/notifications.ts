import { http } from '@gtms/commons'

export default {
  url: '/notifications',
  provider: 'notifications',
  name: 'Notifications service',
  locations: [
    {
      path: '/web-push/check',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/web-push',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/web-push',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/settings',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/settings',
      method: http.GET,
      restricted: true,
    },
  ],
}
