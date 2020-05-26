import fetch from 'node-fetch'
import { makeUrl } from './commons'
import { ISerializedPost } from '@gtms/commons'

export const findPostsByIds = (
  ids: string[],
  options: {
    traceId: string
    appKey: string
  }
): Promise<ISerializedPost[]> => {
  const { traceId, appKey } = options
  return fetch(makeUrl('posts/find-by-ids'), {
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
