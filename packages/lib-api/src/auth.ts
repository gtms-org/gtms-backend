import fetch from 'node-fetch'
import { makeUrl, IOptions } from './commons'
import { ISerializedUser } from '@gtms/commons'

const AUTH_SERVICE = 'auth'

export const findUsersByIds = (
  ids: string[],
  options: IOptions
): Promise<ISerializedUser[]> => {
  const { traceId } = options
  return makeUrl(AUTH_SERVICE, '/users/find-by-ids').then(url => {
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

export const getUser = (
  id: string,
  options: IOptions
): Promise<ISerializedUser> => {
  const { traceId } = options

  return makeUrl(AUTH_SERVICE, `/users/${id}?basic=1`).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        return res.json()
      }

      throw await res.text()
    })
  })
}
