import amqp from 'amqplib'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  publishOnChannel,
} from '@gtms/client-queue'
import { UserModel, IUser } from '@gtms/lib-models'
import { Queues, IFileQueueMsg, FileStatus, FileTypes } from '@gtms/commons'
import logger from '@gtms/lib-logger'

const retryPolicy: IRetryPolicy = {
  queue: Queues.updateUserFiles,
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
  user,
}: {
  files: string[]
  fileType: FileTypes
  status: FileStatus
  user: IUser
}) => {
  switch (fileType) {
    case FileTypes.avatar:
      return {
        avatar: {
          status,
          files,
        },
      }

    case FileTypes.userGallery:
      break
  }
}

const processNewUpload = (payload: IFileQueueMsg) => {
  return new Promise(async (resolve, reject) => {
    const {
      data: { relatedRecord, owner, traceId, files, fileType, status } = {},
    } = payload

    UserModel.findOneAndUpdate(
      {
        _id: relatedRecord,
        owner,
      },
      getUpdatePayload({ files: files.map(f => f.url), fileType, status }),
      {
        upsert: false,
      }
    )
      .then(async (user: IUser | null) => {
        if (!user) {
          logger.log({
            level: 'error',
            message: `Someone tried to upload files to not existing user, payload: ${JSON.stringify(
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
  const ok = ch.assertQueue(Queues.updateUserFiles, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.updateUserFiles,
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
