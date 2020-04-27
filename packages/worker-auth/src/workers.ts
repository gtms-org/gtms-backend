import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { initUpdateTask, initFilesTask } from './tasks'

let queueConnection: amqp.Connection

export async function startWorkers() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn

        // maybe use promises here, and log a msg when all tasks are initialized?
        initUpdateTask(ch)
        initFilesTask(ch)
      })
    })
    .catch(err => {
      logger.log({
        message: `Can not connect to queue, ${err}`,
        level: 'error',
      })

      process.exit(1)
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
