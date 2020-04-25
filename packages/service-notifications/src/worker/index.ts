import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, NotificationQueueMessageType } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
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
      ttl: 28800000,
    },
    {
      name: '16h',
      ttl: 57600000,
    },
  ],
}

const sendMsgToRetry = getSendMsgToRetryFunc(retryPolicy)

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
