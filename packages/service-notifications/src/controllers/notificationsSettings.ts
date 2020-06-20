import { Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import {
  INotificationsSettings,
  NotificationsSettingsModel,
  serializeNotificationsSettings,
} from '@gtms/lib-models'

export default {
  mySettings(req: IAuthRequest, res: Response, next: NextFunction) {
    ;(NotificationsSettingsModel as any).findOrCreate(
      {
        user: req.user.id,
      },
      (err: Error | null, notificationSettings: INotificationsSettings) => {
        if (err) {
          next(err)

          return logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }

        res
          .status(200)
          .json(serializeNotificationsSettings(notificationSettings))
      }
    )
  },
  updateMySettings(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req
    const payload = [
      'invitation',
      'newPostInOwnedGroup',
      'newMembershipRequestInOwnedGroup',
      'newMemberInOwnedGroup',
      'newPostInAdminnedGroup',
      'newMembershipRequestInAdminnedGroup',
      'newMemberInAdminnedGroup',
    ].reduce(
      (results: { [item: string]: boolean | string }, item) => {
        if (typeof body[item] !== 'undefined') {
          results[item] = !!body[item]
        }

        return results
      },
      { user: req.user.id }
    )

    NotificationsSettingsModel.update({ user: req.user.id }, payload, {
      upsert: true,
      setDefaultsOnInsert: true,
    })
      .then(() => {
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
}
