import fetch from 'node-fetch'
import { makeUrl } from './commons'
import { ISerializedGroup } from '@gtms/commons'

export const canAddPost = (
  user: string,
  group: string,
  options: {
    traceId: string
  }
): Promise<void> => {
  const { traceId } = options
  return makeUrl('groups', `/can-add-post?user=${user}&group=${group}`).then(
    url => {
      return fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-traceid': traceId,
        },
        method: 'GET',
      }).then(res => {
        if (res.status === 200) {
          return
        }

        throw res.status
      })
    }
  )
}

export const hasGroupAdminRights = (
  user: string,
  group: string,
  options: {
    traceId: string
  }
): Promise<void> => {
  const { traceId } = options
  return makeUrl(
    'groups',
    `/check-admin-rights?user=${user}&group=${group}`
  ).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(res => {
      if (res.status === 200) {
        return
      }

      throw res.status
    })
  })
}

export const findGroupsByIds = (
  ids: string[],
  options: {
    traceId: string
  }
): Promise<ISerializedGroup[]> => {
  const { traceId } = options
  return makeUrl('groups', '/find-by-ids').then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(async res => {
      if (res.status === 200) {
        return res.json()
      }

      throw await res.text()
    })
  })
}
