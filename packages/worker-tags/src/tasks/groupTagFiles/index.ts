import amqp from 'amqplib'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  publishOnChannel,
} from '@gtms/client-queue'
import { GroupTagModel, IGroupTag } from '@gtms/lib-models'
import { Queues, IFileQueueMsg, FileStatus } from '@gtms/commons'
import { hasGroupAdminRights } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'

const retryPolicy: IRetryPolicy = {
  queue: Queues.updateGroupTagFiles,
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

const processNewUpload = (payload: IFileQueueMsg) => {
  return new Promise(async (resolve, reject) => {
    const {
      data: { relatedRecord, owner, traceId, files, fileType, status } = {},
    } = payload

    let groupTag: IGroupTag | null

    try {
      groupTag = await GroupTagModel.findById(relatedRecord)
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Database error: ${err}`,
        traceId,
      })

      return reject('database error')
    }

    if (groupTag === null) {
      logger.log({
        level: 'warn',
        message: `GroupTag record ${relatedRecord} for file ${fileType} not found in DB, skipping processing`,
        traceId,
      })

      return resolve()
    }

    hasGroupAdminRights(owner, `${groupTag.group}`, {
      traceId,
    })
      .then(async () => {
        groupTag.logo = {
          status,
          files: files.map(f => f.url),
        }

        try {
          groupTag.save()
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Database error: ${err}`,
            traceId,
          })

          return reject('database error')
        }

        try {
          await publishOnChannel(Queues.createFile, payload)
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Can not publish message to ${
              Queues.createFile
            } queue, payload: ${JSON.stringify(payload)}, error: ${err}`,
            traceId,
          })
        }

        resolve()
      })
      .catch(() => {
        logger.log({
          level: 'warn',
          message: `User ${owner} does not have right to upload files for groupTag ${relatedRecord}, skipping processing`,
          traceId,
        })

        resolve()
      })
  })
}

const processReadyFiles = (msg: IFileQueueMsg) => {
  return new Promise((resolve, reject) => {
    const {
      data: { files, traceId, status, relatedRecord, fileType } = {},
    } = msg

    GroupTagModel.findOneAndUpdate(
      {
        _id: relatedRecord,
      },
      {
        logo: {
          status,
          files: files.map(f => f.url),
        },
      },
      {
        upsert: false,
      }
    )
      .then((groupTag: IGroupTag | null) => {
        if (groupTag) {
          logger.log({
            level: 'info',
            message: `GroupTag ${relatedRecord} has been updated with ${fileType} files`,
            traceId,
          })
        } else {
          logger.log({
            level: 'error',
            message: `Can not update files for groupTag ${relatedRecord} - record does not exist`,
            traceId,
          })
        }

        resolve()
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error ${err}`,
          traceId,
        })

        reject('database error')
      })
  })
}

const processMsg = (msg: amqp.Message) => {
  let jsonMsg: IFileQueueMsg

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.updateGroupTagFiles
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  const { data: { status } = {} } = jsonMsg

  switch (status) {
    case FileStatus.uploaded:
      return processNewUpload(jsonMsg)

    case FileStatus.ready:
      return processReadyFiles(jsonMsg)

    default:
      // ignore any other status
      return Promise.resolve()
  }
}

export function initFilesTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.updateGroupTagFiles, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.updateGroupTagFiles,
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
