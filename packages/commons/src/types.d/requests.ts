import { Request } from 'express'

export interface IAuthRequest extends Request {
  user: {
    id: string
    name: string
    surname: string
    email: string
    countryCode: string
    languageCode: string
    roles: string[]
  }
}
