import { http } from '@gtms/commons'
import config from 'config'

export default {
  url: '/posts',
  provider: config.get<string>('services.posts'),
  name: 'Posts service',
  locations: [
    {
      path: '/find-by-ids',
      method: http.POST,
    },
  ],
}
