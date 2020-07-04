import { Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import {
  WebPushSubscriptionModel,
  IWebPushSubscription,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { body } = req

    WebPushSubscriptionModel.update(
      { owner: req.user.id },
      {
        subscription: body.subscription,
        owner: req.user.id,
        userAgent: body.userAgent,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .then(() => {
        logger.log({
          message: `User ${req.user.email} subscribed for web push notifications from ${body.userAgent}`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res.status(201).end()
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
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  checkIfExists(req: IAuthRequest, res: Response, next: NextFunction): void {
    const { subscription } = req.body

    WebPushSubscriptionModel.findOne({
      subscription,
      owner: req.user.id,
    })
      .then((subscription: IWebPushSubscription | null) => {
        if (!subscription) {
          return res.status(404).end()
        }

        res.status(200).end()
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
  deleteSubscription(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): void {
    const { subscription } = req.params

    WebPushSubscriptionModel.findOneAndDelete({
      subscription,
      owner: req.user.id,
    })
      .then((result: IWebPushSubscription | null) => {
        if (result !== null) {
          res.status(200).end()
          logger.log({
            message: `User ${req.user.email} unsubscribed from web push notifications`,
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
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
}
