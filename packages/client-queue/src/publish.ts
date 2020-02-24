import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import {
  INotificationQueueMsg,
  IDeleteAccountQueueMsg,
  Queues,
} from '@gtms/commons'
import config from 'config'

export function publishOnChannel<T>(queueName: string, message: T) {
  return amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then((conn: amqp.Connection) => {
      conn
        .createChannel()
        .then(async (ch: amqp.Channel) => {
          await ch.assertQueue(queueName, {
            durable: true,
          })
          const jsonStr = JSON.stringify(message)
          await ch.sendToQueue(queueName, Buffer.from(jsonStr), {
            persistent: true,
          })

          logger.log({
            level: 'info',
            message: `Message ${jsonStr} has been sent to channel queue ${queueName}`,
          })

          ch.close().catch(() => null)
        })
        .finally(() => {
          setTimeout(() => conn.close(), 500)
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
