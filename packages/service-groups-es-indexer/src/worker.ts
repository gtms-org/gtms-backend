import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import {
  Queues,
  CreateUpdateGroupQueueMessageType,
  IGroupQueueMsg,
} from '@gtms/commons'

function processMsg(msg: amqp.Message) {
  const json: IGroupQueueMsg = JSON.parse(msg.content.toString())

  logger.log({
    level: 'info',
    message: `New message in ${Queues.createUpdateGroup} queue`,
    traceid: json.data?.traceId,
  })

  switch (json.type) {
    case CreateUpdateGroupQueueMessageType.create:
      // todo
      return
    case CreateUpdateGroupQueueMessageType.update:
      // todo
      return

    default:
      logger.log({
        level: 'error',
        message: `Not supported message in the queue ${
          Queues.createUpdateGroup
        } - ${msg.content.toString()}`,
        traceid: json.data?.traceId,
      })
      break
  }
}

let queueConnection: amqp.Connection

export async function listenToGroupsQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn
        const ok = ch.assertQueue(Queues.createUpdateGroup, { durable: true })
        ok.then(() => {
          ch.prefetch(1)
        }).then(() => {
          ch.consume(Queues.createUpdateGroup, processMsg, {
            noAck: true,
          })
        })
      })
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
