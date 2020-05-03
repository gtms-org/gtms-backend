import config from 'config'

export function makeUrl(url: string) {
  return `${config.get<string>('internalGatekeeper')}/${url}`
}
