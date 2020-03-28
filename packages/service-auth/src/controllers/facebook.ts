import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import FacebookProviderModel, {
  IFacebookProvider,
} from '../models/facebookProvider'
import UserModel, { IUser } from '../models/users'
import crypto from 'crypto'
import logger from '@gtms/lib-logger'
import authenticate from '../helpers/authenticate'
import sendActivationEmail from '../helpers/sendActivationEmail'

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
        authenticate(user, res.get('x-traceid')).then(data => {
          if (data) {
            logger.log({
              message: `User ${user.email} logged successfully using facebook (id: ${fb._id})`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })
            res.status(201).json(data)
          } else {
            res.status(500).end()
          }
        })

        sendActivationEmail(user, res.get('x-traceid'))
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

      authenticate(user, res.get('x-traceid')).then(data => {
        if (data) {
          logger.log({
            message: `User ${user.email} logged successfully using facebook (id: ${fb._id})`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          res.status(201).json(data)
        } else {
          res.status(500).end()
        }
      })
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
