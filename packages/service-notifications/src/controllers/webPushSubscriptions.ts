import { Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import WebPushSubscriptionModel, {
  IWebPushSubscription,
} from '../models/webPushSubscriptions'
import logger from '@gtms/lib-logger'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { body } = req

    WebPushSubscriptionModel.create({
      subscription: body.subscription,
      owner: req.user.id,
      userAgent: body.userAgent,
    })
      .then((subscription: IWebPushSubscription) => {
        logger.log({
          message: `New subscription ${subscription.hash} (owner: ${subscription.owner}) has been created`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res
          .status(201)
          .json({
            hash: subscription.hash,
          })
          .end()
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
          res
            .status(400)
            .json(err.errors)
            .end()
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
  checkIfExists(req: IAuthRequest, res: Response): void {
    const { hash } = req.params

    WebPushSubscriptionModel.findOne({
      hash,
      owner: req.user.id,
    })
      .then((subscription: IWebPushSubscription | null) => {
        if (!subscription) {
          return res.status(404).end()
        }

        res
          .status(200)
          .json({
            hash: subscription.hash,
            userAgent: subscription.userAgent,
          })
          .end()
      })
      .catch(() => {
        res.status(404).end()
      })
  },
  deleteRecord(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { hash } = req.params

    WebPushSubscriptionModel.findOneAndDelete({
      hash,
      owner: req.user.id,
    })
      .then((result: IWebPushSubscription | null) => {
        if (result !== null) {
          res.status(200).end()
          logger.log({
            message: `Subscription ${result.hash} (user id: ${result.owner}) has been removed from DB`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
        } else {
          res.status(404).end()
        }
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Request error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
}
