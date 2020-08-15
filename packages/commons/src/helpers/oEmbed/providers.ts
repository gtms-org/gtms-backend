import providers from './providers.json'

interface IProvider {
  provider_name: string
  provider_url: string
  endpoints: {
    schemes?: string[]
    url: string
  }[]
}

export interface IProviders {
  [schema: string]: {
    providerName: string
    providerUrl: string
    oembedUrl: string
  }
}

let cache: IProviders

export function getProviders(): IProviders {
  if (!cache) {
    cache = providers.reduce((all: IProviders, provider: IProvider) => {
      for (const endpoint of provider.endpoints) {
        if (!Array.isArray(endpoint.schemes)) {
          return all
        }

        for (const schema of endpoint.schemes) {
          all[
            schema
              .replace(new RegExp('/', 'g'), '\\/')
              .replace(/\*/g, '\\S*')
              .replace(/\./g, '\\.')
          ] = {
            providerName: provider.provider_name,
            providerUrl: provider.provider_url,
            oembedUrl: endpoint.url,
          }
        }
      }

      return all
    }, {})
  }

  return cache
}
