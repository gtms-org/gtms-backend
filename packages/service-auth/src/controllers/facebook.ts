import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import {
  IFacebookProvider,
  FacebookProviderModel,
  UserModel,
  IUser,
} from '@gtms/lib-models'
import crypto from 'crypto'
import logger from '@gtms/lib-logger'
import authenticate from '../helpers/authenticate'
import sendActivationEmail from '../helpers/sendActivationEmail'
import { publishOnChannel } from '@gtms/client-queue'
import { IFileQueueMsg, Queues, FileTypes, FileStatus } from '@gtms/commons'
import serializeCookie from '../helpers/cookies'
import config from 'config'

export default async function(req: Request, res: Response, next: NextFunction) {
  const {
    body: { accessToken, id, countryCode, languageCode },
  } = req

  if (!accessToken || !id) {
    return res.status(409).end()
  }

  const params = new URLSearchParams()
  params.append('access_token', accessToken)
  params.append('fields', 'id, name, email, picture')

  try {
    const response = await fetch(
      `https://graph.facebook.com/v2.8/${id}?${params.toString()}`
    ).then(fbRes => {
      if (fbRes.status !== 200) {
        throw new Error('Invalid response')
      }
      return fbRes.json()
    })

    const name = response.name.split(' ')
    const fb: IFacebookProvider = await FacebookProviderModel.findOne({
      id: response.id,
    })

    if (!fb) {
      // new user
      let user: IUser

      try {
        user = await UserModel.create({
          name: name[0],
          surname: name[1],
          email: response.email,
          password: 'F' + crypto.randomBytes(35).toString('hex'),
          countryCode,
          languageCode,
        })
      } catch (err) {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return res.status(400).json(err.errors)
        } else {
          logger.log({
            message: `Request error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return next(err)
        }
      }

      FacebookProviderModel.create({
        accessToken,
        id,
        name: response.name,
        user: user._id,
      }).then((fb: IFacebookProvider) => {
        authenticate(user, res.get('x-traceid'))
          .then(data => {
            if (data) {
              logger.log({
                message: `User ${user.email} logged successfully using facebook (id: ${fb._id})`,
                level: 'info',
                traceId: res.get('x-traceid'),
              })
              res.status(201).json(data)

              // fetch user image
              fetch(
                `https://graph.facebook.com/${id}/picture?access_token=${accessToken}&redirect=false&width=800&height=800`
              )
                .then(res => {
                  if (res.status !== 200) {
                    throw new Error('Invalid response')
                  }

                  return res.json()
                })
                .then(data => {
                  return publishOnChannel<IFileQueueMsg>(
                    Queues.updateUserFiles,
                    {
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
                        traceId: res.get('x-traceid'),
                      },
                    }
                  )
                })
                .then(() => {
                  logger.log({
                    level: 'info',
                    message: `Info about user's facebook photo has been published to the queue`,
                    traceId: res.get('x-traceid'),
                  })
                })
                .catch(err => {
                  logger.log({
                    level: 'error',
                    message: `Can not publish user's facebook photo info; error: ${err}`,
                    traceId: res.get('x-traceid'),
                  })
                })
            } else {
              res.status(500).end()
            }
          })
          .then(() => {
            sendActivationEmail(user, res.get('x-traceid'))
          })
          .catch(() => res.status(500).end())
      })
    } else {
      // existing user
      const user = await UserModel.findOne({ _id: fb.user, isBlocked: false })

      if (!user) {
        logger.log({
          message: `Not existing user / or blocked tried to login using FB ${fb._id} (${fb.name})`,
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

      authenticate(user, res.get('x-traceid'))
        .then(data => {
          if (data) {
            logger.log({
              message: `User ${user.email} logged successfully using facebook (id: ${fb._id})`,
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

            // update FB access token in DB
            fb.accessToken = accessToken
            fb.save().catch(err => {
              logger.log({
                message: `Can not update FB user access token, database error - ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            })
          } else {
            res.status(500).end()
          }
        })
        .catch(() => res.status(500).end())
    }
  } catch (err) {
    res.status(400).end()

    logger.log({
      message: `Invalid response from Facebook API for user id ${id}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })
  }
}
