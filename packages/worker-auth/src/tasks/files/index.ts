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
  extra,
  traceId,
}: {
  files: string[]
  fileType: FileTypes
  status: FileStatus
  user: IUser
  extra?: {
    id: string
  }
  traceId: string
}): {
  extra?: {
    id: string
  }
  update: any
} => {
  switch (fileType) {
    case FileTypes.avatar:
      return {
        extra: undefined,
        update: {
          avatar: {
            status,
            files,
          },
        },
      }

    case FileTypes.userGallery:
      const gallery = user.gallery || []

      if (extra) {
        const index = gallery.findIndex(file => {
          return file.id === extra.id
        })

        if (index === -1) {
          logger.log({
            level: 'error',
            message: `Can not find file ${
              extra.id
            } in user gallery, can not update user in DB, user record: ${JSON.stringify(
              user.toObject()
            )}`,
            traceId,
          })
        } else {
          gallery[index] = {
            status,
            files,
            id: extra.id,
          }
        }
        return {
          extra: undefined,
          update: {
            gallery,
          },
        }
      } else {
        const id = `${new Date().getTime()}-${gallery.length + 1}`
        gallery.push({
          status,
          files,
          id,
        })

        return {
          extra: { id },
          update: {
            gallery: [...gallery],
          },
        }
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

    if (relatedRecord !== owner) {
      logger.log({
        level: 'error',
        message: `Someone tried to upload files for not his user account, payload: ${JSON.stringify(
          payload
        )}`,
        traceId,
      })

      return resolve()
    }

    UserModel.findOne(owner)
      .then((user: IUser | null) => {
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

        const { extra, update } = getUpdatePayload({
          files: files.map(f => f.url),
          fileType,
          status,
          user,
          traceId,
        })

        UserModel.findOneAndUpdate({ _id: relatedRecord }, update, {
          upsert: false,
        })
          .then(async () => {
            payload.data.extra = extra

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

const processReadyFiles = (msg: IFileQueueMsg) =>
  new Promise((resolve, reject) => {
    const {
      data: { files, traceId, status, fileType, extra, owner } = {},
    } = msg

    UserModel.findOne(owner).then((user: IUser | null) => {
      if (!user) {
        logger.log({
          level: 'error',
          message: `Someone tried to upload files to not existing user, payload: ${JSON.stringify(
            msg
          )}`,
          traceId,
        })

        return resolve()
      }

      let payload

      try {
        payload = getUpdatePayload({
          files: files.map(f => f.url),
          fileType,
          status,
          traceId,
          extra,
          user,
        })
      } catch (err) {
        return reject(err)
      }

      UserModel.findOneAndUpdate({ _id: owner }, payload.update, {
        upsert: false,
      })
        .then(resolve)
        .catch(err => {
          logger.log({
            level: 'error',
            message: `Database error: ${err}`,
            traceId,
          })

          reject('database error')
        })
    })
  })

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
