import { IUser } from '../models/users'
import { ISerializedUser } from '@gtms/commons'

export function serializeUser(user: IUser): ISerializedUser {
  return {
    id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    countryCode: user.countryCode,
    languageCode: user.languageCode,
    tags: user.tags || [],
    roles: user.roles || [],
  }
}
