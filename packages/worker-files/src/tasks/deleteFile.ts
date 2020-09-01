import amqp from 'amqplib'
import AWS from 'aws-sdk'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, IDeleteFileQueueMsg } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'

AWS.config.update({
  accessKeyId: config.get<string>('awsAccessKeyId'),
  secretAccessKey: config.get<string>('awsSecretAccessKey'),
  region: config.get<string>('awsRegion'),
})

const s3Client = new AWS.S3({
  endpoint: config.get<string>('awsEndpoint'),
})

const retryPolicy: IRetryPolicy = {
  queue: Queues.deleteFile,
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
  ],
}

const sendMsgToRetry = getSendMsgToRetryFunc(retryPolicy)

function processMsg(msg: amqp.Message) {
  return new Promise(async (resolve, reject) => {
    let jsonMsg: IDeleteFileQueueMsg

    try {
      jsonMsg = JSON.parse(msg.content.toString())
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Can not parse ${
          Queues.createFile
        } queue message: ${msg.content.toString()} / error: ${err}`,
      })
      return reject(`can not parse json`)
    }

    const {
      data: { bucket, file, traceId },
    } = jsonMsg

    logger.log({
      level: 'info',
      message: `New message in ${
        Queues.deleteFile
      } queue : ${msg.content.toString()}`,
      traceId,
    })

    s3Client.deleteObject(
      {
        Bucket: bucket,
        Key: file,
      },
      err => {
        if (err) {
          logger.log({
            level: 'error',
            message: `Can not delete file ${file} from bucket ${bucket} - ${err}`,
            traceId,
          })

          return reject('can not delete file')
        }

        logger.log({
          level: 'info',
          message: `File ${file} has been deleted from bucket ${bucket}`,
          traceId,
        })

        resolve()
      }
    )
  })
}

export function initDeleteFileTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.deleteFile, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.deleteFile,
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
