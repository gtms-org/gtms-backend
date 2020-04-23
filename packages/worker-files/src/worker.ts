import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, IFileQueueMsg } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getTTLExchangeName,
} from '@gtms/client-queue'

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
  return new Promise((_resolve, reject) => {
    reject('testing dead letter queue: ' + msg.content.toString())
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
