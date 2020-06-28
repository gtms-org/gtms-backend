import { INotification, RecordType } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export function handleNewGroupJoinerNotification(msg: INotification) {
  return new Promise((resolve, reject) => {
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
  })
}
