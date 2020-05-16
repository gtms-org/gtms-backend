import amqp from 'amqplib'
import config from 'config'
import {
  onQueueConnectionError,
  setConnectionErrorsHandlers,
} from '@gtms/client-queue'
import { initUpdateTagTask } from './tasks/updateTag'
import { initFilesTask } from './tasks/groupTagFiles'

let queueConnection: amqp.Connection

export async function listenQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn

        setConnectionErrorsHandlers(conn)

        initUpdateTagTask(ch)
        initFilesTask(ch)
      })
    })
    .catch(onQueueConnectionError)
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
