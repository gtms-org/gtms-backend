import fetch from 'node-fetch'
import { makeUrl, IOptions } from './commons'
import { ISerializedPost, ISerializedGroup } from '@gtms/commons'

const POSTS_SERVICE = 'posts'

export const findPostsByIds = (
  ids: string[],
  options: IOptions
): Promise<ISerializedPost[]> => {
  const { traceId } = options

  return makeUrl(POSTS_SERVICE, '/find-by-ids').then(url => {
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

export const getPost = (
  id: string,
  options: IOptions
): Promise<ISerializedPost & { group?: ISerializedGroup }> => {
  const { traceId } = options

  return makeUrl(POSTS_SERVICE, `/${id}`).then(url => {
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
