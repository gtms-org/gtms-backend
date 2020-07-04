import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import { Queues, ICreateUserNotificationSettingsMsg } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'
import { NotificationsSettingsModel } from '@gtms/lib-models'

const retryPolicy: IRetryPolicy = {
  queue: Queues.createUserNotificationSettings,
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
  return new Promise(async (resolve, reject) => {
    let json: ICreateUserNotificationSettingsMsg

    try {
      json = JSON.parse(msg.content.toString())
    } catch (err) {
      return reject('can not parse json')
    }

    const {
      data: { userId, traceId },
    } = json
    ;(NotificationsSettingsModel as any).findOrCreate(
      {
        owner: userId,
      },
      (err: Error | null) => {
        if (err) {
          logger.log({
            level: 'error',
            message: `Database error, can not create user notification settings - ${err}`,
            traceId,
          })

          return reject('database error')
        }

        logger.log({
          level: 'info',
          message: `Notification settings for user ${userId} has been created`,
          traceId,
        })

        resolve()
      }
    )
  })
}

export async function initCreateUserNotificationSettingsTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.createUserNotificationSettings, {
    durable: true,
  })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.createUserNotificationSettings,
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
}
