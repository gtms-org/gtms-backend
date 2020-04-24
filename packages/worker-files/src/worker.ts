import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, IFileQueueMsg, FileStatus } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getTTLExchangeName,
} from '@gtms/client-queue'
import { processFile, FileOperation } from './processFile'

const retryPolicy: IRetryPolicy = {
  queue: Queues.createFile,
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
    {
      name: '48h',
      ttl: 172800000,
    },
  ],
}

function processMsg(msg: amqp.Message) {
  return new Promise(async (resolve, reject) => {
    let jsonMsg: IFileQueueMsg

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

    const { data: { fileType, status, files, traceId } = {} } = jsonMsg

    logger.log({
      level: 'info',
      message: `New message in ${
        Queues.createFile
      } queue : ${msg.content.toString()}`,
      traceId,
    })

    if (status !== FileStatus.uploaded) {
      logger.log({
        level: 'warn',
        message: `File ${msg.content.toString()} has incorrect status, wont be process`,
        traceId,
      })

      return resolve()
    }

    const operations = config.get<FileOperation[][] | undefined>(
      `files.${fileType}`
    )

    if (!operations) {
      logger.log({
        level: 'error',
        message: `No configuration for file type ${fileType}; file ${msg.content.toString()} can not be process`,
        traceId,
      })

      return reject(`no configuration`)
    }

    try {
      await Promise.all(
        files.map(file => processFile(fileType, file.url, operations))
      )

      // @todo need to sync DB here somehow

      logger.log({
        level: 'info',
        message: `File ${msg.content.toString()} successfully processed`,
        traceId,
      })

      resolve()
    } catch (err) {
      logger.log({
        level: 'error',
        message: `File ${msg.content.toString()} can not be process, error: ${err}`,
        traceId,
      })

      reject('processing error')
    }
  })
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
        Queues.createFile
      } / error: ${reasonOfFail}`,
      traceId,
    })
    return
  }

  channel.publish(
    getTTLExchangeName(Queues.createFile),
    `retry-${attempt}`,
    content,
    {
      persistent: true,
    }
  )
}

let queueConnection: amqp.Connection

export async function listenToFilesQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn

        const ok = ch.assertQueue(Queues.createFile, { durable: true })
        ok.then(async () => {
          await setupRetriesPolicy(ch, retryPolicy)
          ch.prefetch(1)
        }).then(() => {
          ch.consume(
            Queues.createFile,
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
