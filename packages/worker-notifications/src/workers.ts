import amqp from 'amqplib'
import config from 'config'
import {
  initNewNotificationTask,
  initSendEmailTask,
  initCreateUserNotificationSettingsTask,
} from './tasks'
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

        initNewNotificationTask(ch)
        initSendEmailTask(ch)
        initCreateUserNotificationSettingsTask(ch)
      })
    })
    .catch(onQueueConnectionError)
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
