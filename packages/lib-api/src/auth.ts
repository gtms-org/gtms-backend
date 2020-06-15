import fetch from 'node-fetch'
import { makeUrl } from './commons'
import { ISerializedUser } from '@gtms/commons'

export const findUsersByIds = (
  ids: string[],
  options: {
    traceId: string
  }
): Promise<ISerializedUser[]> => {
  const { traceId } = options
  return makeUrl('auth', '/users/find-by-ids').then(url => {
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
