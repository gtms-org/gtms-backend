import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import {
  Queues,
  ITmpFileQueueMsg,
  IFileQueueMsg,
  FILES_QUEUE_MAPPER,
  FileStatus,
} from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  publishOnChannel,
} from '@gtms/client-queue'
import { TmpFileModel } from '@gtms/lib-models'
import { processFile, FileOperation } from '../helpers'

const retryPolicy: IRetryPolicy = {
  queue: Queues.createFileFromTmp,
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
    let jsonMsg: ITmpFileQueueMsg

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
      data: { fileType, relatedRecord, files, extra, owner, traceId },
    } = jsonMsg

    logger.log({
      level: 'info',
      message: `New message in ${
        Queues.createFileFromTmp
      } queue : ${msg.content.toString()}`,
      traceId,
    })

    if (!config.has(`files.${fileType}`)) {
      logger.log({
        level: 'error',
        message: `No configuration for file type ${fileType}; file ${msg.content.toString()} can not be process`,
        traceId,
      })

      return reject(`no configuration`)
    }

    let tmpFiles

    try {
      tmpFiles = await TmpFileModel.find({
        _id: {
          $in: files,
        },
      })
    } catch (err) {
      logger.log({
        level: 'info',
        message: `Can not fetch tmp files list from DB - ${err}`,
        traceId,
      })
      reject('database error')
      return
    }

    if (tmpFiles.length === 0) {
      return
    }

    const operations = config.get<FileOperation[][] | undefined>(
      `files.${fileType}`
    )

    try {
      const result: string[][] = await Promise.all(
        tmpFiles.map(file => processFile(fileType, file.url, operations))
      )

      logger.log({
        level: 'info',
        message: `Tmp File ${msg.content.toString()} successfully processed`,
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

      // todo: delete tmp files

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

export function initProcessTmpFileTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.createFileFromTmp, { durable: true })
  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.createFileFromTmp,
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
