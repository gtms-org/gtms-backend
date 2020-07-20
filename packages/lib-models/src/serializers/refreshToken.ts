import { IRefreshToken } from '../models/refreshToken'
import { ISerializedRefreshToken } from '@gtms/commons'

export function serializeRefreshToken(
  token: IRefreshToken
): ISerializedRefreshToken {
  return {
    id: token._id,
    ipAddress: token.ipAddress,
    userAgent: token.userAgent,
    createdAt: token.createdAt,
  }
}
