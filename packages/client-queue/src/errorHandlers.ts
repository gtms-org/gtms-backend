import logger from '@gtms/lib-logger'
import amqp from 'amqplib'

const onError = (err: Error) => {
  logger.log({
    level: 'error',
    message: `Queue error: ${err}`,
  })

  process.exit(1)
}

const onClose = () => {
  logger.log({
    level: 'error',
    message: `Connection with queue has been closed`,
  })

  process.exit(1)
}

export const onQueueConnectionError = (err: Error) => {
  logger.log({
    level: 'error',
    message: `Can not connect to the queue, error: ${err}`,
  })

  process.exit(1)
}

export const setConnectionErrorsHandlers = (conn: amqp.Connection) => {
  conn.on('error', onError)

  conn.on('close', onClose)
}
