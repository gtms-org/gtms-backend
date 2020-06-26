import amqp from 'amqplib'
import config from 'config'
import { initNewPostCommentTask } from './tasks'
import {
  onQueueConnectionError,
  setConnectionErrorsHandlers,
} from '@gtms/client-queue'

let queueConnection: amqp.Connection

export async function startWorkers() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      setConnectionErrorsHandlers(conn)

      await conn.createChannel().then(ch => {
        queueConnection = conn

        initNewPostCommentTask(ch)
      })
    })
    .catch(onQueueConnectionError)
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
