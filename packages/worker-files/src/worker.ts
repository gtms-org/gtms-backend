import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, IFileQueueMsg } from '@gtms/commons'

function processMsg(msg: amqp.Message) {
}

let queueConnection: amqp.Connection

export async function listenToGroupsQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn
        const ok = ch.assertQueue(Queues.createFile, { durable: true })
        ok.then(() => {
          ch.prefetch(1)
        }).then(() => {
          ch.consume(Queues.createFile, processMsg, {
            noAck: true,
          })
        })
      })
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
