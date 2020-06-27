import { INotification, RecordType } from '@gtms/commons'
import { getPost, getGroupAdmins } from '@gtms/lib-api'
import {
  NotificationsSettingsModel,
  INotificationsSettings,
  NotificationModel,
} from '@gtms/lib-models'
import { ObjectID } from 'mongodb'
import logger from '@gtms/lib-logger'

export function handleNewPostNotification(msg: INotification) {
  return new Promise(async (resolve, reject) => {
    const {
      relatedRecordType,
      relatedRecordId,
      traceId,
      notificationType,
    } = msg.data

    if (!relatedRecordId) {
      return reject('New post id has not been provided')
    }

    if (relatedRecordType !== RecordType.post) {
      return reject('Record type is not equal post')
    }

    const post = await getPost(relatedRecordId, { traceId })
    const admins = await getGroupAdmins(post.group.id, { traceId })

    NotificationsSettingsModel.find({
      $or: [
        {
          groups: new ObjectID(post.group.id),
        },
        {
          user: {
            $in: admins.map((id: string) => new ObjectID(id)),
          },
          newPostInAdminnedGroup: true,
        },
        {
          user: new ObjectID(post.group.owner),
          newPostInOwnedGroup: true,
        },
      ],
    })
      .then((notifications: INotificationsSettings[]) => {
        if (notifications.length === 0) {
          return
        }

        NotificationModel.insertMany(
          notifications.map(record => {
            return {
              relatedRecordType,
              relatedRecordId,
              notificationType,
              owner: record.user,
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
  })
}
