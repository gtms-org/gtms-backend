/* eslint-disable @typescript-eslint/camelcase */
import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'
import {
  IGoogleProvider,
  GoogleProviderModel,
  UserModel,
  IUser,
} from '@gtms/lib-models'
import authenticate from '../helpers/authenticate'
import { generateRandomUsername } from '../helpers/generateUsername'
import serializeCookie from '../helpers/cookies'
import logger from '@gtms/lib-logger'
import crypto from 'crypto'
import config from 'config'
import { publishOnChannel } from '@gtms/client-queue'
import { IFileQueueMsg, Queues, FileTypes, FileStatus } from '@gtms/commons'

interface IGoogleAccount {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  link: string
  picture: string
  gender: string
  locale: string
  hd: string
}

async function getAccessTokenFromCode(code: string) {
  return await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: config.get<string>('googleClientId'),
      client_secret: config.get<string>('googleClientSecret'),
      redirect_uri: config.get<string>('googleRedirectUrl'),
      grant_type: 'authorization_code',
      code,
    }),
  }).then(res => res.json())
}

async function getGoogleAccountFromCode(
  code: string,
  traceId: string
): Promise<IGoogleAccount> {
  const res = await getAccessTokenFromCode(code)

  logger.log({
    traceId,
    level: 'info',
    message: `Got auth response from google - ${JSON.stringify(res)}`,
  })

  const { access_token } = res

  const userInfo = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then(res => res.json())

  return userInfo
}

function updateUserPhoto(
  gAccount: IGoogleAccount,
  user: IUser,
  traceId: string
) {
  fetch(gAccount.picture)
    .then(res => {
      if (res.status !== 200) {
        logger.log({
          level: 'warn',
          message: 'Can not fetch user profile image from google account',
          traceId,
        })
        return
      }

      return res.json()
    })
    .then(data => {
      return publishOnChannel<IFileQueueMsg>(Queues.updateUserFiles, {
        data: {
          relatedRecord: user._id,
          status: FileStatus.uploaded,
          fileType: FileTypes.avatar,
          owner: user._id,
          files: [
            {
              url: data.data.url,
            },
          ],
          traceId,
        },
      })
    })
    .then(() => {
      logger.log({
        level: 'info',
        message: `Info about user's google photo has been published to the queue`,
        traceId,
      })
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `Can not publish user's facebook photo info; error: ${err}`,
        traceId,
      })
    })
}

async function registerNewGoogleProvider({
  gAccount,
  req,
  res,
  next,
  countryCode,
  languageCode,
}: {
  gAccount: IGoogleAccount
  req: Request
  res: Response
  next: NextFunction
  languageCode: string
  countryCode: string
}) {
  // check if someone already register an account with given email
  let user = await UserModel.findOne({
    email: gAccount.email,
  })

  if (!user) {
    let username: string
    try {
      username = await generateRandomUsername(
        gAccount.given_name,
        gAccount.family_name
      )
    } catch (err) {
      logger.log({
        message: `Error during random nickname generation - ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })
      return res.status(500).end()
    }

    try {
      user = await UserModel.create({
        username,
        name: gAccount.given_name,
        surname: gAccount.family_name,
        email: gAccount.email,
        password: 'F' + crypto.randomBytes(35).toString('hex'),
        countryCode,
        languageCode,
      })
    } catch (err) {
      logger.log({
        message: `Can not create a new user account. Database error - ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }
  }

  GoogleProviderModel.create({
    id: gAccount.id,
    name: gAccount.name,
    user: user._id,
  })
    .then((google: IGoogleProvider) => {
      // check if account was activated
      if (user.isActive !== true) {
        logger.log({
          message: `Account ${req.body.email} is not yet activated, can not login`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })
        res.status(403).json({
          message: 'Account is not active',
        })
        return
      }

      authenticate({
        user,
        traceId: res.get('x-traceid'),
        ipAddress: (req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress) as string,
        userAgent: req.get('User-Agent'),
      })
        .then(data => {
          if (!data) {
            return res.status(500).end()
          }

          logger.log({
            message: `User ${user.email} logged successfully using google (id: ${google._id})`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })

          updateUserPhoto(gAccount, user, res.get('x-traceid'))

          res.status(201).json(data)
        })
        .catch(() => {
          res.status(500).end()
        })
    })
    .catch(err => {
      logger.log({
        message: `Can not create a new google provider record. Database error - ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      next(err)
    })
}

export default async function(req: Request, res: Response, next: NextFunction) {
  const {
    body: { code, countryCode, languageCode },
  } = req

  if (!code) {
    return res.status(409).end()
  }

  let gAccount: IGoogleAccount
  let provider: IGoogleProvider | undefined

  try {
    gAccount = await getGoogleAccountFromCode(code, res.get('x-traceid'))
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not fetch account details from google - ${err}`,
      traceId: res.get('x-traceid'),
    })

    return res.status(500).end()
  }

  logger.log({
    level: 'info',
    message: `Got user account details from google - ${JSON.stringify(
      gAccount
    )}`,
    traceId: res.get('x-traceid'),
  })

  try {
    provider = await GoogleProviderModel.findOne({
      id: gAccount.id,
    })
  } catch (err) {
    logger.log({
      message: `Database error - ${err}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })

    return next(err)
  }

  if (!provider) {
    return registerNewGoogleProvider({
      gAccount,
      req,
      res,
      next,
      countryCode,
      languageCode,
    })
  }

  const user = await UserModel.findOne({ _id: provider.user, isBlocked: false })

  if (!user) {
    logger.log({
      message: `Not existing user / or blocked tried to login using FB ${provider._id} (${provider.name})`,
      level: 'info',
      traceId: res.get('x-traceid'),
    })
    return res.status(401).json({ message: 'Invalid email/password' })
  }
  // check if account was activated
  if (user.isActive !== true) {
    logger.log({
      message: `Account ${req.body.email} is not yet activated, can not login`,
      level: 'info',
      traceId: res.get('x-traceid'),
    })
    res.status(403).json({
      message: 'Account is not active',
    })
    return
  }

  authenticate({
    user,
    traceId: res.get('x-traceid'),
    ipAddress: (req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress) as string,
    userAgent: req.get('User-Agent'),
  }).then(data => {
    if (data) {
      logger.log({
        message: `User ${user.email} logged successfully using google (id: ${provider._id})`,
        level: 'info',
        traceId: res.get('x-traceid'),
      })
      res
        .status(201)
        .header(
          'Set-Cookie',
          serializeCookie(
            'accessToken',
            data.accessToken,
            config.get<number>('tokenLife')
          )
        )
        .append(
          'Set-Cookie',
          serializeCookie(
            'refreshToken',
            data.refreshToken,
            config.get<number>('refreshTokenLife')
          )
        )
        .json(data)
    } else {
      res.status(500).end()
    }
  })
}
