import userModel, { IUser } from '../models/users'
import refreshTokenModel, { IRefreshToken } from '../models/refreshToken'
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import logger from '@gtms/lib-logger'
import authenticate, { getJWTData } from '../helpers/authenticate'
import config from 'config'
import serializeCookie from '../helpers/cookies'
import sendActivationEmail from '../helpers/sendActivationEmail'

export default {
  count(_: Request, res: Response, next: NextFunction): void {
    userModel
      .estimatedDocumentCount({})
      .then((counter: number) => {
        res.status(200).json({ counter })
      })
      .catch(err => {
        next(err)
      })
  },
  create(req: Request, res: Response, next: NextFunction): void {
    const { body } = req
    userModel
      .create({
        name: body.name,
        surname: body.surname,
        email: body.email,
        phone: body.phone,
        password: body.password,
        countryCode: body.countryCode,
        languageCode: body.languageCode,
      })
      .then((user: IUser) => {
        const {
          _id,
          name,
          surname,
          email,
          phone,
          countryCode,
          languageCode,
        } = user

        logger.log({
          message: `New user with email ${email} and name ${name ||
            'empty'} ${surname || 'empty'} successfuly created`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res.status(201).json({
          id: _id,
          name,
          surname,
          email,
          phone,
          countryCode,
          languageCode,
        })

        sendActivationEmail(user, res.get('x-traceid'))
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
          res.status(400).json(err.errors)
        } else {
          next(err)

          logger.log({
            message: `Request error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  authenticate(req: Request, res: Response, next: NextFunction): void {
    userModel
      .findOne({ email: req.body.email, isBlocked: false })
      .then(async (user: IUser) => {
        if (!user) {
          logger.log({
            message: `Not existing user (${req.body.email})`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          res.status(401).json({
            message: 'Invalid email/password',
          })
          return
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

        if (bcrypt.compareSync(req.body.password, user.password)) {
          authenticate(user, res.get('x-traceid')).then(data => {
            if (data) {
              logger.log({
                message: `User ${req.body.email} logged successfully`,
                level: 'info',
                traceId: res.get('x-traceid'),
              })
              // set cookies
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
                .end()
            } else {
              res.status(500).end()
            }
          })
        } else {
          logger.log({
            message: `Invalid email or password (${req.body.email})`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          res.status(401).json({
            message: 'Invalid email/password',
          })
        }
      })
      .catch((err: Error) => {
        next(err)
      })
  },
  refreshToken(req: Request, res: Response, next: NextFunction): void {
    refreshTokenModel
      .findOne({ token: req.body.token && req.body.token.trim() })
      .populate('user')
      .then(async (token: IRefreshToken | null) => {
        if (!token) {
          res.status(401).json({ message: 'Token is invalid' })

          logger.log({
            message: `Someone tried to refresh token with invalid refreshToken (${req.body.token})`,
            level: 'warn',
            traceId: res.get('x-traceid'),
          })

          return
        }

        const newToken = jwt.sign(
          await getJWTData(token.user as IUser, res.get('x-traceid')),
          config.get<string>('secret'),
          {
            expiresIn: config.get<string>('tokenLife'),
          }
        )

        res
          .status(201)
          .header(
            'Set-Cookie',
            serializeCookie(
              'accessToken',
              newToken,
              config.get<number>('tokenLife')
            )
          )
          .json({
            accessToken: newToken,
          })

        logger.log({
          level: 'info',
          message: `Token was successfuly refresh using refreshToken ${req.body.token} for user ${token.user._id} (${token.user.email})`,
          traceId: res.get('x-traceid'),
        })
      })
      .catch((err: Error) => {
        next(err)
      })
  },
}
