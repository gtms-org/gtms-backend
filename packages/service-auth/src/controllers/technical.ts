import { Response, NextFunction } from 'express'
import {
  IUser,
  UserModel,
  IRefreshToken,
  RefreshTokenModel,
  serializeRefreshToken,
} from '@gtms/lib-models'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export default {
  loginHistory(req: IAuthRequest, res: Response, next: NextFunction) {
    UserModel.findById(req.user.id)
      .then((user: IUser | null) => {
        if (!user) {
          logger.log({
            level: 'error',
            message: `Can not return login history, user not found - ${JSON.stringify(
              req.user
            )}`,
            traceId: res.get('x-traceid'),
          })
          return res.status(404).end()
        }

        res
          .status(200)
          .json(user.loginHistory || [])
          .end()
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  activeSessions(req: IAuthRequest, res: Response, next: NextFunction) {
    RefreshTokenModel.find({
      user: req.user.id,
    })
      .then((tokens: IRefreshToken[]) => {
        res.status(200).json(tokens.map(token => serializeRefreshToken(token)))
      })
      .catch(err => {
        next(err)
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  deleteSession(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    RefreshTokenModel.deleteOne({
      user: req.user.id,
      _id: id,
    })
      .then(result => {
        if (result.n > 0) {
          return res.status(200).end()
        }

        res.status(404).end()
      })
      .catch(err => {
        next(err)
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
}
