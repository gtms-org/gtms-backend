import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import { PostModel } from '@gtms/lib-models'
import { Queues, IFileQueueMsg, FileStatus, FileTypes } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'

const retryPolicy: IRetryPolicy = {
  queue: Queues.updatePostFiles,
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
  return new Promise((resolve, reject) => {
    let jsonMsg: IFileQueueMsg

    try {
      jsonMsg = JSON.parse(msg.content.toString())
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Can not parse ${
          Queues.updatePostFiles
        } queue message: ${msg.content.toString()} / error: ${err}`,
      })
      return Promise.reject(`can not parse json`)
    }

    const {
      data: { files, traceId, status, relatedRecord, fileType, owner, extra },
    } = jsonMsg

    if (fileType !== FileTypes.postImage) {
      logger.log({
        level: 'error',
        message: `Not supported file type, message in ${
          Queues.updatePostFiles
        } queue will be ignored - ${msg.content.toString()}`,
        traceId,
      })

      return reject('not supported FileType')
    }

    if (status !== FileStatus.ready) {
      logger.log({
        level: 'error',
        message: `File status ${status} is not supported / Queue: ${
          Queues.updatePostFiles
        } / Message: ${msg.content.toString()}`,
        traceId,
      })

      return reject('not supported FileStatus')
    }

    PostModel.updateOne(
      {
        _id: relatedRecord,
        owner,
      },
      {
        $push: {
          images: {
            status,
            files: files.map(file => file.url),
          },
        },
      }
    )
      .then(() => {
        logger.log({
          message: `Post ${relatedRecord} has been updated with an image`,
          level: 'info',
          traceId,
        })

        resolve()
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })

        reject('database error')
      })
  })
}

export function initFilesTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.updatePostFiles, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.updatePostFiles,
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
