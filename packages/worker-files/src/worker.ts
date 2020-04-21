import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import { Queues, IFileQueueMsg } from '@gtms/commons'

function processMsg(msg: amqp.Message) {

  console.log('NEW MESSAGE', JSON.parse(msg.content.toString()))

  return new Promise((resolve, reject) => {
    reject('testing dead letter queue')
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

  if (attempt > 3) {
    logger.log({
      level: 'error',
      message: `Could not process message ${content.toString()} / channel: ${
        Queues.createFile
      } / error: ${reasonOfFail}`,
      traceId,
    })
    return
  }

  channel.publish('TTL-FILES', `retry-${attempt}`, content, {
    persistent: true,
  })
}

function assertExchanges(channel: amqp.Channel) {
  return Promise.all([
    channel.assertExchange('TTL-FILES', 'direct', { durable: true }),
    channel.assertExchange('DLX-FILES', 'fanout', { durable: true }),
  ]).then(() => channel)
}

function assertQueues(channel: amqp.Channel) {
  return Promise.all([
    channel.assertQueue('files-retry-1-30s', {
      durable: true,
      deadLetterExchange: 'DLX-FILES',
      messageTtl: 30000,
    }),
    channel.assertQueue('files-retry-2-10m', {
      durable: true,
      deadLetterExchange: 'DLX-FILES',
      messageTtl: 600000,
    }),
    channel.assertQueue('files-retry-3-48h', {
      durable: true,
      deadLetterExchange: 'DLX-FILES',
      messageTtl: 195840000,
    }),
  ]).then(() => channel)
}

function bindExchangesToQueues(channel: amqp.Channel) {
  return Promise.all([
    channel.bindQueue('files-retry-1-30s', 'TTL-FILES', 'retry-1'),
    channel.bindQueue('files-retry-2-10m', 'TTL-FILES', 'retry-2'),
    channel.bindQueue('files-retry-3-48h', 'TTL-FILES', 'retry-3'),
    channel.bindQueue(Queues.createFile, 'DLX-FILES', '')
  ])
}

function setupRetriesPolicy(channel: amqp.Channel) {
  return assertExchanges(channel)
    .then(assertQueues)
    .then(bindExchangesToQueues)
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
          await setupRetriesPolicy(ch)
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
