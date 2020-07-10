import { INotification, RecordType } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { getUser, getGroup, getGroupAdmins } from '@gtms/lib-api'
import {
  NotificationsSettingsModel,
  INotificationsSettings,
  NotificationModel,
} from '@gtms/lib-models'
import { ObjectID } from 'mongodb'

export function handleNewGroupJoinerNotification(msg: INotification) {
  return new Promise(async (resolve, reject) => {
    const {
      relatedRecordType,
      relatedRecordId,
      traceId,
      owner,
      notificationType,
    } = msg.data

    if (!relatedRecordId) {
      logger.log({
        level: 'error',
        message: `Notification ${notificationType} has no related record id`,
        traceId,
      })
      return reject('New post id has not been provided')
    }

    if (relatedRecordType !== RecordType.group) {
      logger.log({
        level: 'error',
        message: `Notification ${notificationType} has invalid related record type - ${relatedRecordType}`,
        traceId,
      })
      return reject('Record type is not equal post')
    }

    try {
      const [user, group, groupAdmins] = await Promise.all([
        getUser(owner, { traceId }),
        getGroup(relatedRecordId, { traceId }),
        getGroupAdmins(relatedRecordId, { traceId }),
      ])

      NotificationsSettingsModel.find({
        $or: [
          {
            groups: new ObjectID(relatedRecordId),
          },
          {
            newMemberInAdminnedGroup: true,
            owner: {
              $in: groupAdmins.map((id: string) => new ObjectID(id)),
            },
          },
          {
            newMemberInOwnedGroup: true,
            owner: new ObjectID(group.owner),
          },
        ],
      })
        .then((notifications: INotificationsSettings[]) => {
          if (notifications.length === 0) {
            return resolve()
          }

          NotificationModel.insertMany(
            notifications.map(record => {
              return {
                relatedRecordType,
                relatedRecordId,
                notificationType,
                owner: record.owner,
                payload: user,
              }
            })
          )
            .then(created => {
              resolve()

              logger.log({
                level: 'info',
                message: `${created.length} notifications has been created`,
                traceId,
              })
            })
            .catch(err => {
              logger.log({
                message: `Database error ${err}`,
                level: 'error',
                traceId,
              })

              reject('database error')
            })
        })
        .catch(err => {
          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId,
          })

          reject('database error')
        })
    } catch (err) {
      logger.log({
        level: 'error',
        message: `API error - ${err}`,
        traceId,
      })

      return reject('api error')
    }
  })
}
