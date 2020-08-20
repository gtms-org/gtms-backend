import fetch from 'node-fetch'
import { makeUrl, IOptions } from './commons'

export interface IIframelyResponse {
    
}

export const getOembed = (
    url: string
  ): Promise<ISerializedGroup[]> => {
    const { traceId } = options
    return makeUrl(GROUPS_SERVICE, '/find-by-ids').then(url => {
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
  