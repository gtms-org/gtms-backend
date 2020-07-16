import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import { Queues, GroupUpdateTypes, IGroupUpdateMsg } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'
import { processIncreasePostsCounterMsg } from './increasePostsCounter'
import { processDescreasedPostsCounterMsg } from './descreasePostsCounter'
import { processUpdateGroupTagsMsg } from './updateTags'

const retryPolicy: IRetryPolicy = {
  queue: Queues.groupUpdate,
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
  let jsonMsg: IGroupUpdateMsg

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.groupUpdate
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  switch (jsonMsg.type) {
    case GroupUpdateTypes.increasePostsCounter:
      return processIncreasePostsCounterMsg(jsonMsg)

    case GroupUpdateTypes.descreasePostsCounter:
      return processDescreasedPostsCounterMsg(jsonMsg)

    case GroupUpdateTypes.updateTags:
      return processUpdateGroupTagsMsg(jsonMsg)
  }
}

export function initUpdateTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.groupUpdate, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.groupUpdate,
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
