import { IUser } from '../models/users'
import { ISerializedUser } from '@gtms/commons'

export function serializeUser(user: IUser): ISerializedUser {
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    surname: user.surname,
    description: user.description,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    countryCode: user.countryCode,
    languageCode: user.languageCode,
    tags: user.tags || [],
    roles: user.roles || [],
    postsCounter: user.postsCounter || 0,
  }
}
