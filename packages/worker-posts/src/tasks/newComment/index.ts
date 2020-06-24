import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import { Queues, INewPostCommentMsg } from '@gtms/commons'
import { PostModel } from '@gtms/lib-models'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'
import { resolve } from 'path'

const retryPolicy: IRetryPolicy = {
  queue: Queues.newComment,
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
  let jsonMsg: INewPostCommentMsg

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.newComment
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  return new Promise((resolve, reject) => {
    const {
      post,
      data: { comment, traceId, parentComment },
    } = jsonMsg

    const updateQuery: any = {
      $inc: {
        commentsCounter: 1,
      },
    }

    if (!parentComment) {
      updateQuery.$push = {
        firstComments: {
          $each: [
            {
              id: comment.id,
              text: comment.text,
              tags: comment.tags,
              owner: comment.owner,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
            },
          ],
          $sort: { createdAt: 1 },
          $slice: 5,
        },
      }
    }

    PostModel.updateOne(
      {
        _id: post,
      },
      updateQuery
    )
      .then(({ nModified }) => {
        if (nModified > 0) {
          logger.log({
            level: 'info',
            message: `Post ${post} has been updated with last comments and commentsCounter`,
            traceId,
          })
        } else {
          logger.log({
            level: 'warn',
            message: `Can not modify post record, post ${post} not found`,
            traceId,
          })
        }

        resolve()
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })

        return reject('database error')
      })
  })
}

export function initNewPostCommentTask(ch: amqp.Channel) {
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
