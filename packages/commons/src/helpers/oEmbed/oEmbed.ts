import { getProviders } from './providers'
import { IOEmbed } from '../../types.d'
import fetch from 'node-fetch'

interface IProvider {
  providerName: string
  providerUrl: string
  oembedUrl: string
}

function fetchEmbed(provider: IProvider, url: string): Promise<IOEmbed> {
  return fetch(`${provider.oembedUrl}?url=${url}`)
    .then(res => res.json())
    .then(result => ({
      url,
      result,
    }))
}

export async function findEmbeds(text: string): Promise<IOEmbed[]> {
  const providers = getProviders()
  const toFetch = []

  for (const path of Object.keys(providers)) {
    const regexp = new RegExp(path, 'g')

    const results = text.match(regexp)

    if (results) {
      toFetch.push({
        results,
        provider: providers[path],
      })
    }
  }

  if (toFetch.length > 0) {
    return await Promise.all(
      toFetch.reduce((all: Promise<IOEmbed>[], item) => {
        for (const url of item.results) {
          all.push(fetchEmbed(item.provider, url))
        }

        return all
      }, [])
    )
  }

  return []
}

export function replaceEmbedsWithHtml(text: string, oEmbeds: IOEmbed[]) {
  let html = text

  for (const oEmbed of oEmbeds) {
    html = html.replace(oEmbed.url, oEmbed.result.html)
  }

  return html
}
