import amqp from 'amqplib'
import { GroupModel, IGroup } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import { Queues, IFileQueueMsg, FileStatus, FileTypes } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  publishOnChannel,
} from '@gtms/client-queue'

const retryPolicy: IRetryPolicy = {
  queue: Queues.updateGroupFiles,
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

const getUpdatePayload = ({
  files,
  fileType,
  status,
}: {
  files: string[]
  fileType: FileTypes
  status: FileStatus
}) => {
  switch (fileType) {
    case FileTypes.groupLogo:
      return {
        avatar: {
          status,
          files,
        },
      }
    case FileTypes.groupBg:
      return {
        bg: {
          status,
          files,
        },
      }
    default:
      throw new Error(`File ${fileType} is not supported`)
  }
}

const processNewUpload = (payload: IFileQueueMsg) => {
  return new Promise(async (resolve, reject) => {
    const {
      data: { relatedRecord, owner, traceId, files, fileType, status } = {},
    } = payload

    GroupModel.findOneAndUpdate(
      {
        _id: relatedRecord,
        owner,
      },
      getUpdatePayload({ files: files.map(f => f.url), fileType, status }),
      {
        upsert: false,
      }
    )
      .then(async (group: IGroup | null) => {
        if (!group) {
          logger.log({
            level: 'error',
            message: `Someone tried to upload files to not existing group, payload: ${JSON.stringify(
              payload
            )}`,
            traceId,
          })
          return resolve()
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
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error: ${err}`,
          traceId,
        })

        reject('database error')
      })
  })
}

const processReadyFiles = (msg: IFileQueueMsg) => {
  return new Promise((resolve, reject) => {
    const {
      data: { files, traceId, status, relatedRecord, fileType } = {},
    } = msg

    let payload

    try {
      payload = getUpdatePayload({
        files: files.map(f => f.url),
        fileType,
        status,
      })
    } catch (err) {
      return reject(err)
    }

    GroupModel.findOneAndUpdate(
      {
        _id: relatedRecord,
      },
      payload,
      {
        upsert: false,
      }
    )
      .then((group: IGroup | null) => {
        if (group) {
          logger.log({
            level: 'info',
            message: `Group ${relatedRecord} has been updated with ${fileType} files`,
            traceId,
          })
        } else {
          logger.log({
            level: 'error',
            message: `Can not update files for ${relatedRecord} - record does not exist`,
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
        Queues.updateGroupFiles
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
  const ok = ch.assertQueue(Queues.updateGroupFiles, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.updateGroupFiles,
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
