import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import {
  INotificationQueueMsg,
  IDeleteAccountQueueMsg,
  Queues,
} from '@gtms/commons'

const { QUEUE_HOST = 'localhost' } = process.env

export function publishOnChannel<T>(queueName: string, message: T) {
  return amqp
    .connect(`amqp://${QUEUE_HOST}`)
    .then((conn: amqp.Connection) => {
      conn
        .createChannel()
        .then(async (ch: amqp.Channel) => {
          await ch.assertQueue(queueName, {
            durable: true,
          })

          const jsonStr = JSON.stringify(message)
          ch.sendToQueue(queueName, Buffer.from(jsonStr))

          logger.log({
            level: 'info',
            message: `Message ${jsonStr} has been sent to channel queue ${queueName}`,
          })

          ch.close().catch(() => null)
        })
        .finally(() => {
          conn.close()
        })
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `Can not create QUEUE CHANNEL ${err}`,
      })
    })
}

export function publishToDeleteChannel(
  message: IDeleteAccountQueueMsg
): Promise<void> {
  return publishOnChannel<IDeleteAccountQueueMsg>(Queues.deleteAccount, message)
}

export function publishToNotificationsChannel(
  message: INotificationQueueMsg
): Promise<void> {
  return publishOnChannel<INotificationQueueMsg>(Queues.notifications, message)
}
