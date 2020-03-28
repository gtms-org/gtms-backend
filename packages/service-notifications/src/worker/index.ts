import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, NotificationQueueMessageType } from '@gtms/commons'
import { sendEmail } from './email'

function processMsg(msg: amqp.Message) {
  const json = JSON.parse(msg.content.toString())

  switch (json.type) {
    case NotificationQueueMessageType.email:
      return sendEmail(json.data)

    default:
      logger.log({
        level: 'error',
        message: `Not supported message in notification queue ${msg.content.toString()}`,
        traceid: json.data?.traceid,
      })
      break
  }
}

let queueConnection: amqp.Connection

export async function listenToNotificationQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn
        const ok = ch.assertQueue(Queues.notifications, { durable: true })
        ok.then(() => {
          ch.prefetch(1)
        }).then(() => {
          ch.consume(Queues.notifications, processMsg, {
            noAck: true,
          })
        })
      })
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
