import fetch from 'node-fetch'
import { makeUrl } from './commons'
import logger from '@gtms/lib-logger'

const IFRAMELY_SERVICE = 'iframely'

export interface IIframelyResponse {
  meta: {
    description: string
    title: string
    canonical: string
  }
  links: {
    thumbnail: {
      href: string
      type: 'image/png' | 'image/jpeg'
      rel: string[]
    }
  }
  rel: string[]
  html?: string
}

export const getOembed = (url: string): Promise<IIframelyResponse> => {
  return makeUrl(IFRAMELY_SERVICE, `/iframely?url=${url}`).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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

const URL_REGEXP = /(https?:\/\/[^\s]+)/g

export const findAndLoadEmbeds = (
  text: string,
  traceId: string
): Promise<string> => {
  return new Promise(resolve => {
    const results = text.match(URL_REGEXP)

    if (!Array.isArray(results)) {
      return resolve(text)
    }

    Promise.all(
      results.map(url =>
        getOembed(url)
          .then(oembed => {
            if (oembed.html) {
              return oembed.html
            }

            return `<blockquote class="urlPreview">
        ${
          oembed.links.thumbnail
            ? `<a href="${oembed.meta.canonical}"><img src="${oembed.links.thumbnail}" alt="" /></a>`
            : ''
        }
        <h3>${oembed.meta.title}</h3>
        <p>${oembed.meta.description}</p>
        <p class="url"><a href="${oembed.meta.canonical}">${
              oembed.meta.canonical
            }</a></p>
      </blockquote>`
          })
          .then(html => ({
            url,
            html,
          }))
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Iframely error for url: ${url} - ${err}`,
              traceId,
            })

            return null
          })
      )
    ).then(results => {
      let html = text

      for (const result of results) {
        if (result === null) {
          continue
        }

        html = html.replace(result.url, result.html)
      }

      resolve(html)
    })
  })
}
