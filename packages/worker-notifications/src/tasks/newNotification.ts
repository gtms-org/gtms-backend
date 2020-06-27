import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import { Queues, INotification } from '@gtms/commons'
import { NotificationModel } from '@gtms/lib-models'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'

const retryPolicy: IRetryPolicy = {
  queue: Queues.newNotification,
  retries: [
    {
      name: '30s',
      ttl: 30000,
    },
    {
      name: '10m',
      ttl: 600000,
    },
    {
      name: '1h',
      ttl: 3600000,
    },
    {
      name: '8h',
      ttl: 28800000,
    },
    {
      name: '24h',
      ttl: 86400000,
    },
  ],
}

const sendMsgToRetry = getSendMsgToRetryFunc(retryPolicy)

const processMsg = (msg: amqp.Message) => {
  let jsonMsg: INotification

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.newNotification
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  return new Promise((resolve, reject) => {
    const { data } = jsonMsg

    NotificationModel.create({
      relatedRecordType: data.relatedRecordType,
      relatedRecordId: data.relatedRecordId,
      notificationType: data.notificationType,
      owner: data.owner,
      payload: data.payload,
    })
      .then(notification => {
        resolve()
        logger.log({
          level: 'info',
          message: `A new notification ${notification.notificationType} for user ${notification.owner} has been saved`,
          traceId: data.traceId,
        })
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: data.traceId,
        })

        reject('database error')
      })
  })
}

export function initNewNotificationTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.newComment, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.newComment,
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
