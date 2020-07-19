import jwt from 'jsonwebtoken'
import { IUser, RefreshTokenModel } from '@gtms/lib-models'
import config from 'config'
import logger from '@gtms/lib-logger'

export function getJWTData(user: IUser): Promise<any> {
  return new Promise(async resolve => {
    const result: any = {
      id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      languageCode: user.languageCode,
      roles: user.roles,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      avatar: user.avatar,
      groupsMember: user.groupsMember,
      groupsAdmin: user.groupsAdmin,
      groupsOwner: user.groupsOwner,
    }

    resolve(result)
  })
}

export default async function(user: IUser, traceId: string) {
  const userData = await getJWTData(user)

  const token = jwt.sign(userData, config.get<string>('secret'), {
    expiresIn: config.get<string>('tokenLife'),
  })

  const refreshToken = jwt.sign(
    { id: user._id },
    config.get<string>('refreshTokenSecret'),
    {
      expiresIn: config.get<string>('refreshTokenLife'),
    }
  )

  try {
    await RefreshTokenModel.deleteMany({
      user: user._id,
    })
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not delete user's old tokens ${err}`,
      traceId,
    })

    throw err
  }

  try {
    await RefreshTokenModel.create({
      token: refreshToken,
      user: user._id,
    })

    return {
      accessToken: token,
      refreshToken,
    }
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Error during refresh token creation ${err}`,
      traceId,
    })
    throw err
  }
}
