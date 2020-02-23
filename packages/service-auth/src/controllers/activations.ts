import { Request, Response, NextFunction } from 'express'
import ActivationCodeModel, { IActivationCode } from '../models/activationCode'
import UserModel, { IUser } from '../models/users'
import logger from '@gtms/lib-logger'
import sendRemindPassEmail from '../helpers/sendRemindPassEmail'
import sendDeleteAccountEmail from '../helpers/sendDeleteAccountEmail'
import { IAuthRequest, IDeleteAccountQueueMsg } from '@gtms/commons'
import { publishToDeleteChannel } from '@gtms/client-queue'
import FacebookProviderModel from '../models/facebookProvider'

export default {
  activateAccount(req: Request, res: Response, next: NextFunction): void {
    const { code } = req.params

    ActivationCodeModel.findOneAndDelete({ code })
      .populate('owner')
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode) {
          logger.log({
            level: 'warning',
            message: `User tried to activate account with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })
          return res.status(404).end()
        }

        UserModel.updateOne(
          { _id: (activationCode.owner as IUser)._id },
          { isActive: true }
        )
          .then(res => {
            logger.log({
              level: 'info',
              message: `User ${(activationCode.owner as IUser)._id} (${
                (activationCode.owner as IUser).email
              }) activated account`,
              traceId: res.get('x-traceid'),
            })
            res.status(200).end()
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

    if (!body.email || body.email === '') {
      res.status(400).json({
        email: 'Adres email is invalid',
      })
      return
    }

    UserModel.findOne({ email: body.email })
      .then((user: IUser | null) => {
        if (!user) {
          res.status(404).end()

          logger.log({
            level: 'warning',
            message: `User tried to remind password for not exisiting email address: ${body.email}`,
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
    const { body } = req
    const { password, code } = body

    ActivationCodeModel.findOneAndDelete({
      code,
    })
      .populate('owner')
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode) {
          res.status(404).end()

          logger.log({
            level: 'warning',
            message: `User tried to reset password with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })

          return
        }

        UserModel.updateOne(
          { _id: (activationCode.owner as IUser)._id },
          { password }
        )
          .then(res => {
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
  generateDeleteAccountMail(req: IAuthRequest, res: Response): void {
    ActivationCodeModel.create({
      owner: req.user.id,
    }).then((activationCode: IActivationCode) => {
      sendDeleteAccountEmail(activationCode, req.user, res.get('x-traceid'))

      res.status(200).end()
    })
  },
  deleteAccount(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { body } = req
    const { code } = body

    if (!code || code === '') {
      res.status(400).json({
        code: 'Code is invalid',
      })
      return
    }

    ActivationCodeModel.findOneAndDelete({ code })
      .then((activationCode: IActivationCode | null) => {
        if (!activationCode) {
          res.status(404).json({
            code: 'Code does not exist',
          })

          logger.log({
            level: 'warning',
            message: `User tried to delete account with not-existing code ${code}`,
            traceId: res.get('x-traceid'),
          })
        }

        UserModel.findOneAndDelete({ _id: activationCode.owner })
          .then((user: IUser | null) => {
            if (!user) {
              res.status(404).json({
                account: 'Account does not exist',
              })

              logger.log({
                level: 'warning',
                message: `User tried to delete not-existing account with code ${code}`,
                traceId: res.get('x-traceid'),
              })

              return
            }

            res.status(200).end()

            const msg: IDeleteAccountQueueMsg = {
              id: req.user.id,
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
}
