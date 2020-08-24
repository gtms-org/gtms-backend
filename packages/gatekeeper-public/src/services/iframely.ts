import { http } from '@gtms/commons'

export default {
  url: '/iframely',
  provider: 'iframely',
  name: 'Iframely service',
  locations: [
    {
      path: '/iframely',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/oembed',
      method: http.GET,
      restricted: true,
    },
  ],
}
