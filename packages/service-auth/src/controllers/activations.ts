import { Request, Response, NextFunction } from 'express'
import {
  ActivationCodeModel,
  IActivationCode,
  UserModel,
  IUser,
  FacebookProviderModel,
  RefreshTokenModel,
  serializeUser,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import sendRemindPassEmail from '../helpers/sendRemindPassEmail'
import sendDeleteAccountEmail from '../helpers/sendDeleteAccountEmail'
import {
  IAuthRequest,
  IDeleteAccountQueueMsg,
  validateEmailAddress,
  validatePassword,
  Queues,
  IESUserCreateMsg,
  ESIndexUpdateType,
  ESIndexUpdateRecord,
} from '@gtms/commons'
import {
  publishToDeleteChannel,
  publishOnChannel,
  publishMultiple,
} from '@gtms/client-queue'

export default {
  activateAccount(req: Request, res: Response, next: NextFunction): void {
    const { code } = req.params

    ActivationCodeModel.findOneAndDelete({ code })
      .populate('owner')
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode || activationCode.owner === null) {
          logger.log({
            level: 'warn',
            message: `User tried to activate account with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })
          return res.status(404).end()
        }

        UserModel.updateOne(
          { _id: (activationCode.owner as IUser)._id },
          { isActive: true }
        )
          .then(() => {
            res.status(200).end()

            logger.log({
              level: 'info',
              message: `User ${(activationCode.owner as IUser)._id} (${
                (activationCode.owner as IUser).email
              }) activated account`,
              traceId: res.get('x-traceid'),
            })

            publishMultiple(
              res.get('x-traceid'),
              {
                queue: Queues.updateESIndex,
                message: {
                  type: ESIndexUpdateType.create,
                  record: ESIndexUpdateRecord.user,
                  data: {
                    ...serializeUser(activationCode.owner as IUser),
                    traceId: res.get('x-traceid'),
                  },
                },
              },
              {
                queue: Queues.createUserNotificationSettings,
                message: {
                  userId: (activationCode.owner as IUser)._id,
                  traceId: res.get('x-traceid'),
                },
              }
            )
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Error during account activation ${err}`,
              traceId: res.get('x-traceid'),
            })

            next(err)
          })
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error during account activation ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  remindPassword(req: Request, res: Response, next: NextFunction): void {
    const { body } = req

    if (!body.email || body.email === '' || !validateEmailAddress(body.email)) {
      res.status(400).json({
        message: 'Address email is invalid',
      })
      return
    }

    UserModel.findOne({ email: body.email })
      .then((user: IUser | null) => {
        if (!user) {
          res.status(404).end()

          logger.log({
            level: 'warn',
            message: `User tried to remind password for not exisiting email address: ${body.email}`,
            traceId: res.get('x-traceid'),
          })

          return
        }

        if (user.isBlocked) {
          res.status(401).end()

          logger.log({
            level: 'warn',
            message: `User ${user.email} with blocked account tried to remind password`,
            traceId: res.get('x-traceid'),
          })

          return
        }

        if (!user.isActive) {
          res.status(401).end()

          logger.log({
            level: 'warn',
            message: `User ${user.email} with not active account tried to remind password`,
            traceId: res.get('x-traceid'),
          })

          return
        }

        sendRemindPassEmail(user, res.get('x-traceid'))

        res.status(200).end()
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error during remind password flow ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  resetPassword(req: Request, res: Response, next: NextFunction): void {
    const {
      body: { password = '', code = '' },
    } = req

    if (!password || !validatePassword(password) || !code || code === '') {
      logger.log({
        level: 'warn',
        message: `User tried to reset password with invalid payload: ${JSON.stringify(
          req.body
        )}`,
        traceId: res.get('x-traceid'),
      })
      res.status(400).json({
        message: 'Password or code is not valid',
      })
      return
    }

    ActivationCodeModel.findOneAndDelete({
      code,
    })
      .populate('owner')
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode || activationCode.owner === null) {
          res.status(404).end()

          logger.log({
            level: 'warn',
            message: `User tried to reset password with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })

          return
        }

        ;(activationCode.owner as IUser).password = password
        ;(activationCode.owner as IUser)
          .save()
          .then(() => {
            logger.log({
              level: 'info',
              message: `User ${(activationCode.owner as IUser)._id} (${
                (activationCode.owner as IUser).email
              }) changed his password`,
              traceId: res.get('x-traceid'),
            })
            res.status(200).end()
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Error during account password change ${err}`,
              traceId: res.get('x-traceid'),
            })

            next(err)
          })
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error during account password change ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  generateDeleteAccountMail(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): void {
    ActivationCodeModel.create({
      owner: req.user.id,
    })
      .then((activationCode: IActivationCode) => {
        sendDeleteAccountEmail(activationCode, req.user, res.get('x-traceid'))

        res.status(200).end()
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error during activation code creation for account deletion: ${err}`,
          traceId: res.get('x-traceid'),
        })
        next(err)
      })
  },
  deleteAccount(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { body } = req
    const { code } = body

    if (!code || code === '') {
      res
        .status(400)
        .json({
          code: 'Code is invalid',
        })
        .end()
      return
    }

    ActivationCodeModel.findOneAndDelete({ code })
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode) {
          res
            .status(404)
            .json({
              code: 'Code does not exist',
            })
            .end()

          logger.log({
            level: 'warn',
            message: `User tried to delete account with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })
          return
        }

        if (activationCode.owner.toString() !== req.user.id) {
          res.status(401).end()

          logger.log({
            level: 'warn',
            traceId: res.get('x-traceid'),
            message: `User ${JSON.stringify(
              req.user
            )} tried to delete account using code that does not belongs to him (${code})`,
          })

          return
        }

        UserModel.findOneAndDelete({ _id: activationCode.owner })
          .then((user: IUser | null) => {
            if (!user) {
              res.status(404).json({
                account: 'Account does not exist',
              })

              logger.log({
                level: 'warn',
                message: `User tried to delete not-existing account with code ${code}`,
                traceId: res.get('x-traceid'),
              })

              return
            }

            res.status(200).end()

            const msg: IDeleteAccountQueueMsg = {
              id: req.user.id,
              traceId: res.get('x-traceid'),
            }

            publishToDeleteChannel(msg)

            FacebookProviderModel.deleteMany({ user: req.user.id })
              .then(() => {
                logger.log({
                  level: 'info',
                  message: `All FB accounts related to user ${req.user.id} have been deleted`,
                  traceId: res.get('x-traceid'),
                })
              })
              .catch(err => {
                logger.log({
                  level: 'error',
                  message: `Error during Facebook accounts deletion ${err}`,
                  traceId: res.get('x-traceid'),
                })
              })

            ActivationCodeModel.deleteMany({ owner: req.user.id })
              .then(() => {
                logger.log({
                  level: 'info',
                  message: `All activation codes related to user ${req.user.id} have been deleted`,
                  traceId: res.get('x-traceid'),
                })
              })
              .catch(err => {
                logger.log({
                  level: 'error',
                  message: `Error during account deletion ${err}`,
                  traceId: res.get('x-traceid'),
                })
              })

            RefreshTokenModel.deleteMany({ user: req.user.id })
              .then(() => {
                logger.log({
                  level: 'info',
                  message: `All refresh tokens related to user ${req.user.id} have been deleted`,
                  traceId: res.get('x-traceid'),
                })
              })
              .catch(err => {
                logger.log({
                  level: 'error',
                  message: `Error during account deletion ${err}`,
                  traceId: res.get('x-traceid'),
                })
              })
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Error during account deletion ${err}`,
              traceId: res.get('x-traceid'),
            })

            next(err)
          })
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error during account deletion ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  checkCode(req: Request, res: Response, next: NextFunction) {
    const { code } = req.body

    if (!code || code === '') {
      res
        .status(400)
        .json({
          code: 'Code is invalid',
        })
        .end()
      return
    }

    ActivationCodeModel.findOne({ code })
      .then((code: IActivationCode | null) => {
        if (!code) {
          return res.status(404).end()
        }

        res.status(200).end()
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error: ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
}
