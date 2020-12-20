import { INotification, RecordType } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { NotificationModel } from '@gtms/lib-models'

export function handleMentionedInPostNotification(
  msg: INotification
): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      relatedRecordType,
      relatedRecordId,
      traceId,
      notificationType,
      payload,
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

    if (!Array.isArray(payload) || payload.length === 0) {
      logger.log({
        level: 'error',
        message: `Invalid list of mentioned users in payload for ${notificationType}`,
        traceId,
      })

      return reject('Invalid lis of mentioned users')
    }

    NotificationModel.insertMany(
      payload.map((userId: string) => {
        return {
          relatedRecordType,
          relatedRecordId,
          notificationType,
          owner: userId,
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
}
