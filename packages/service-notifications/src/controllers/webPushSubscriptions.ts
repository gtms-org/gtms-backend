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

        res.status(201)
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          res.status(400).json(err.errors)

          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
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
      .then((subscription: IWebPushSubscription) => {
        res.status(200).json({
          hash: subscription.hash,
          userAgent: subscription.userAgent,
        })
      })
      .catch(() => {
        res.status(404)
      })
  },
  deleteRecord(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { hash } = req.params

    WebPushSubscriptionModel.deleteOne({
      hash,
      owner: req.user.id,
    })
      .then(result => {
        if (result.ok === 1) {
          res.status(200)
        } else {
          res.status(404)
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
