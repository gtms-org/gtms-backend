import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import {
  Queues,
  IFileQueueMsg,
  FileStatus,
  FILES_QUEUE_MAPPER,
} from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  publishOnChannel,
  onQueueConnectionError,
  setConnectionErrorsHandlers,
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

const sendMsgToRetry = getSendMsgToRetryFunc(retryPolicy)

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

    const {
      data: {
        fileType,
        status,
        files,
        traceId,
        relatedRecord,
        owner,
        extra,
      } = {},
    } = jsonMsg

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
      const result: string[][] = await Promise.all(
        files.map(file => processFile(fileType, file.url, operations))
      )

      logger.log({
        level: 'info',
        message: `File ${msg.content.toString()} successfully processed`,
        traceId,
      })

      try {
        await publishOnChannel<IFileQueueMsg>(FILES_QUEUE_MAPPER[fileType], {
          data: {
            files: result.flat().map(f => ({ url: f })),
            traceId,
            status: FileStatus.ready,
            relatedRecord,
            fileType,
            owner,
            extra,
          },
        })
      } catch (err) {
        logger.log({
          level: 'error',
          message: `Can not publish message about processed files: ${err}`,
          traceId,
        })

        return reject('publish failed')
      }

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

let queueConnection: amqp.Connection

export async function listenToFilesQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn

        setConnectionErrorsHandlers(conn)

        const ok = ch.assertQueue(Queues.createFile, { durable: true })
        ok.then(async () => {
          await setupRetriesPolicy(ch, retryPolicy)
          ch.prefetch(1)
        }).then(() => {
          logger.log({
            level: 'info',
            message: `Starting to consume queue ${Queues.createFile}`,
          })
          ch.consume(
            Queues.createFile,
            msg => {
              if (msg.fields.redelivered) {
                logger.log({
                  level: 'info',
                  message: 'Redelivered message, sending to retry',
                })
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
    .catch(onQueueConnectionError)
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
