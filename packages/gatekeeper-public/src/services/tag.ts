import { http } from '@gtms/commons'

export default {
  url: '/tags',
  provider: 'tags',
  name: 'Tags service',
  locations: [
    {
      path: '/find',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/promoted/group/:id',
      method: http.PUT,
      restricted: true,
    },
    {
      path: '/promoted/group/:id',
      method: http.GET,
      restricted: false,
    },
    {
      path: '/promoted/:id',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/promoted/:id',
      method: http.DELETE,
      restricted: true,
    },
    {
      path: '/promoted',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/suggested',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/recent',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/recent/group/:id',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/favs',
      method: http.POST,
      restricted: true,
    },
    {
      path: '/favs/group/:id',
      method: http.GET,
      restricted: true,
    },
    {
      path: '/favs/:id',
      method: http.DELETE,
      restricted: true,
    },
  ],
}
