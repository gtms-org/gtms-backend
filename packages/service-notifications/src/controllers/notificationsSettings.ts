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
  follow(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { user, group },
    } = req

    if (!user && !group) {
      return res.status(400).end()
    }

    ;(NotificationsSettingsModel as any).findOrCreate(
      {
        user: req.user.id,
      },
      async (
        err: Error | null,
        notificationSettings: INotificationsSettings
      ) => {
        if (err) {
          next(err)

          return logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }

        let changed = false

        if (user && !notificationSettings.users.includes(user)) {
          notificationSettings.users.push(user)
          changed = true
        }

        if (group && !notificationSettings.groups.includes(group)) {
          notificationSettings.groups.push(group)
          changed = true
        }

        if (changed) {
          try {
            await notificationSettings.save()
          } catch (err) {
            next(err)

            return logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          }
        }

        res.status(201).end()
      }
    )
  },
  unfollow(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { user, group },
    } = req

    if (!user && !group) {
      return res.status(400).end()
    }

    ;(NotificationsSettingsModel as any).findOrCreate(
      {
        user: req.user.id,
      },
      async (
        err: Error | null,
        notificationSettings: INotificationsSettings
      ) => {
        if (err) {
          next(err)

          return logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }

        const userIndex = user ? notificationSettings.users.indexOf(user) : -1
        const groupIndex = group
          ? notificationSettings.groups.indexOf(group)
          : -1

        if (userIndex > -1) {
          notificationSettings.users.splice(userIndex, 1)
        }

        if (groupIndex > -1) {
          notificationSettings.groups.splice(groupIndex, 1)
        }

        if (userIndex > -1 || groupIndex > -1) {
          try {
            await notificationSettings.save()
          } catch (err) {
            next(err)

            return logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          }
        }

        res.status(200).end()
      }
    )
  },
  isFollowing(req: IAuthRequest, res: Response, next: NextFunction) {
    const { user, group } = req.query

    if (!user && !group) {
      return res.status(400).end()
    }

    if (user && group) {
      return res.status(400).end()
    }

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

        if (user) {
          return res
            .status(notificationSettings.users.includes(user) ? 200 : 404)
            .end()
        }

        if (group) {
          return res
            .status(notificationSettings.groups.includes(group) ? 200 : 404)
            .end()
        }

        res.status(400).end()
      }
    )
  },
}
