import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/groups',
  provider: config.get<string>('services.groups'),
  name: 'Groups service',
  locations: [
    {
      path: '/check-admin-rights',
      method: http.GET,
    },
    {
      path: '/find-by-ids',
      method: http.POST,
    },
  ],
}
