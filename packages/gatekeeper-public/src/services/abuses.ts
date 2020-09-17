import { http } from '@gtms/commons'

export default {
  url: '/abuses',
  provider: 'abuses',
  name: 'Abuses service',
  locations: [
    {
      path: '/',
      method: http.POST,
      restricted: true,
    },
  ],
}
