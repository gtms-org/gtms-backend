import fetch from 'node-fetch'
import { makeUrl } from './commons'
import { ISerializedGroup } from '@gtms/commons'

export const hasGroupAdminRights = (
  user: string,
  group: string,
  options: {
    traceId: string
    appKey: string
  }
): Promise<void> => {
  const { traceId, appKey } = options

  return fetch(
    `${makeUrl('groups/check-admin-rights')}?user=${user}&group=${group}`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
        'x-access-key': appKey,
      },
      method: 'GET',
    }
  ).then(res => {
    if (res.status === 200) {
      return
    }

    throw res.status
  })
}

export const findGroupsByIds = (
  ids: string[],
  options: {
    traceId: string
    appKey: string
  }
): Promise<ISerializedGroup[]> => {
  const { traceId, appKey } = options
  return fetch(makeUrl('groups/find-by-ids'), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-traceid': traceId,
      'x-access-key': appKey,
    },
    method: 'POST',
    body: JSON.stringify({ ids }),
  }).then(async res => {
    if (res.status === 200) {
      return res.json()
    }

    throw await res.text()
  })
}
