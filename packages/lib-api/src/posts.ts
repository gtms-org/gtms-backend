import fetch from 'node-fetch'
import { makeUrl } from './commons'
import { ISerializedPost } from '@gtms/commons'

export const findPostsByIds = (
  ids: string[],
  options: {
    traceId: string
  }
): Promise<ISerializedPost[]> => {
  const { traceId } = options

  return makeUrl('posts', '/find-by-ids').then(url => {
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
