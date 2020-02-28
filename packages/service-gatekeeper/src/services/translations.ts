import { http } from '../lib/enums'

export default {
  url: '/translations',
  provider: 'http://gtms-translations-service:',
  name: 'Translations service',
  locations: [
    {
      path: '/',
      method: http.POST,
      restricted: false,
    },
    {
      path: '/:service/:language',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/:service/:language',
      method: http.DELETE,
      restricted: false,
    },
  ],
}
