import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/files',
  provider: config.get<string>('services.files'),
  name: 'Files service',
  locations: [
    {
      path: '/groups/logo',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/groups/bg',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/avatars',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/gallery',
      method: http.POST,
      restricted: true,
    },
  ],
}
