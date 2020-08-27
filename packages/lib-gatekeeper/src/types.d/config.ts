import { http } from '@gtms/commons'

export interface ILocation {
  method: http
  path: string
  restricted?: boolean
  timeout?: number
}

export interface IServiceConfig {
  url: string
  provider: string
  name: string
  locations: ILocation[]
}
