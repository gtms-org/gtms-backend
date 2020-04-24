import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, NotificationQueueMessageType } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getTTLExchangeName,
} from '@gtms/client-queue'
import { sendEmail } from './email'

const retryPolicy: IRetryPolicy = {
  queue: Queues.notifications,
  retries: [
    {
      name: '30s',
      ttl: 30000,
    },
    {
      name: '15m',
      ttl: 900000,
    },
    {
      name: '1h',
      ttl: 3600000,
    },
    {
      name: '3h',
      ttl: 10800000,
    },
    {
      name: '8h',
      ttl: 8800000,
    },
    {
      name: '16h',
      ttl: 57600000,
    },
  ],
}

function getAttemptAndUpdatedContent(msg: amqp.ConsumeMessage) {
  const content = JSON.parse(msg.content.toString())
  content.tryAttempt = ++content.tryAttempt || 1

  return {
    attempt: content.tryAttempt,
    content: Buffer.from(JSON.stringify(content)),
    traceId: content.data?.traceId,
  }
}

function sendMsgToRetry({
  msg,
  channel,
  reasonOfFail,
}: {
  msg: amqp.ConsumeMessage
  channel: amqp.Channel
  reasonOfFail: Error | string
}) {
  const { attempt, content, traceId } = getAttemptAndUpdatedContent(msg)

  if (attempt > 6) {
    logger.log({
      level: 'error',
      message: `Could not process message ${content.toString()} / channel: ${
        Queues.notifications
      } / error: ${reasonOfFail}`,
      traceId,
    })
    return
  }

  channel.publish(
    getTTLExchangeName(Queues.notifications),
    `retry-${attempt}`,
    content,
    {
      persistent: true,
    }
  )
}

function processMsg(msg: amqp.Message) {
  return new Promise((resolve, reject) => {
    let json

    try {
      json = JSON.parse(msg.content.toString())
    } catch (err) {
      return reject('can not parse json')
    }

    switch (json.type) {
      case NotificationQueueMessageType.email:
        sendEmail(json.data)
          .then(resolve)
          .catch(reject)
        break

      default:
        logger.log({
          level: 'error',
          message: `Not supported message in notification queue ${msg.content.toString()}`,
          traceid: json.data?.traceid,
        })
        reject('not supported message type')
        break
    }
  })
}

let queueConnection: amqp.Connection

export async function listenToNotificationQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn
        const ok = ch.assertQueue(Queues.notifications, { durable: true })
        ok.then(async () => {
          await setupRetriesPolicy(ch, retryPolicy)
          ch.prefetch(1)
        }).then(() => {
          ch.consume(
            Queues.notifications,
            msg => {
              if (msg.fields.redelivered) {
                return sendMsgToRetry({
                  msg,
                  channel: ch,
                  reasonOfFail:
                    'Message was redelivered, so something wrong happened',
                })
              }

              processMsg(msg)
                .catch(err => {
                  sendMsgToRetry({
                    msg,
                    channel: ch,
                    reasonOfFail: err,
                  })
                })
                .finally(() => {
                  ch.ack(msg)
                })
            },
            {
              noAck: false,
            }
          )
        })
      })
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
