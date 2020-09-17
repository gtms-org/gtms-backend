import fetch from 'node-fetch'
import { makeUrl, IOptions } from './commons'
import { ISerializedComment } from '@gtms/commons'

const COMMENTS_SERVICE = 'comments'

export const getComment = (
  id: string,
  options: IOptions
): Promise<ISerializedComment> => {
  const { traceId } = options

  return makeUrl(COMMENTS_SERVICE, `/${id}`).then(url => {
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
