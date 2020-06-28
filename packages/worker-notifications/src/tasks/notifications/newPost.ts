import {
  INotification,
  RecordType,
  ISerializedPost,
  ISerializedGroup,
} from '@gtms/commons'
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
      logger.log({
        level: 'error',
        message: `Notification ${notificationType} has no related record id`,
        traceId,
      })
      return reject('New post id has not been provided')
    }

    if (relatedRecordType !== RecordType.post) {
      logger.log({
        level: 'error',
        message: `Notification ${notificationType} has invalid related record type - ${relatedRecordType}`,
        traceId,
      })
      return reject('Record type is not equal post')
    }

    let post: ISerializedPost & {
      group?: ISerializedGroup
    }
    let admins: string[]

    try {
      post = await getPost(relatedRecordId, { traceId })
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Can not fetch info about post - ${err}`,
        traceId,
      })

      return reject('api error')
    }

    try {
      admins = await getGroupAdmins(post.group.id, { traceId })
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Can not fetch info about group admins - ${err}`,
        traceId,
      })

      return reject('api error')
    }

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
          return resolve()
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
