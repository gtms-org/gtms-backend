import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, ITagsUpdateMsg, RecordType } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
  onQueueConnectionError,
  setConnectionErrorsHandlers,
} from '@gtms/client-queue'
import { TagModel, ITag } from '@gtms/lib-models'

const retryPolicy: IRetryPolicy = {
  queue: Queues.updateTags,
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
    let jsonMsg: ITagsUpdateMsg

    try {
      jsonMsg = JSON.parse(msg.content.toString())
    } catch (err) {
      logger.log({
        level: 'error',
        message: `Can not parse ${
          Queues.updateTags
        } queue message: ${msg.content.toString()} / error: ${err}`,
      })
      return reject(`can not parse json`)
    }

    const { recordType, data: { tags, traceId, owner } = {} } = jsonMsg

    logger.log({
      message: `New message on ${
        Queues.updateTags
      } queue: ${msg.content.toString()}`,
      level: 'info',
      traceId,
    })

    TagModel.find({
      name: {
        $in: tags,
      },
    })
      .then((dbTags: ITag[]) => {
        const existing = dbTags.map(t => t.name)

        const dbOperations = tags.map(t => {
          if (!existing.includes(t)) {
            return {
              insertOne: {
                document: {
                  name: t,
                  creator: owner,
                  membersCounter: recordType === RecordType.member ? 1 : 0,
                  postsCounter: recordType === RecordType.post ? 1 : 0,
                  groupsCounter: recordType === RecordType.group ? 1 : 0,
                  totalCounter: 1,
                },
              },
            }
          } else {
            switch (recordType) {
              case RecordType.member:
                return {
                  updateOne: {
                    filter: { name: t },
                    update: {
                      $inc: {
                        membersCounter: 1,
                        totalCounter: 1,
                      },
                    },
                  },
                }
              case RecordType.group:
                return {
                  updateOne: {
                    filter: { name: t },
                    update: {
                      $inc: {
                        groupsCounter: 1,
                        totalCounter: 1,
                      },
                    },
                  },
                }
              case RecordType.post:
                return {
                  updateOne: {
                    filter: { name: t },
                    update: {
                      $inc: {
                        postsCounter: 1,
                        totalCounter: 1,
                      },
                    },
                  },
                }
            }
          }
        })

        if (dbOperations.length === 0) {
          logger.log({
            level: 'info',
            message: 'No tags found, skipping DB update',
            traceId,
          })
          return resolve()
        }

        TagModel.bulkWrite(dbOperations)
          .then(res => {
            logger.log({
              level: 'info',
              message: `Tags list has been updated, new records added: ${res.insertedCount}, records updated: ${res.modifiedCount}`,
              traceId,
            })

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

export function initUpdateTagTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.updateTags, { durable: true })
  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.updateTags,
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
