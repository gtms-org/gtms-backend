import amqp from 'amqplib'
import logger from '@gtms/lib-logger'

export interface IRetryPolicy {
  queue: string
  retries: {
    name: string
    ttl: number
  }[]
}

export const getTTLExchangeName = (queueName: string) => `TTL-${queueName}`
export const getDLXExchangeName = (queueName: string) => `DLX-${queueName}`

function assertExchanges(channel: amqp.Channel, queueName: string) {
  return Promise.all([
    channel.assertExchange(getTTLExchangeName(queueName), 'direct', {
      durable: true,
    }),
    channel.assertExchange(getDLXExchangeName(queueName), 'fanout', {
      durable: true,
    }),
  ]).then(() => channel)
}

function assertQueues(channel: amqp.Channel, policy: IRetryPolicy) {
  const { queue, retries } = policy

  return Promise.all([
    channel.assertQueue(queue, { durable: true }),
    ...retries.map((r, index) =>
      channel.assertQueue(`${queue}-retry-${index + 1}-${r.name}`, {
        durable: true,
        deadLetterExchange: getDLXExchangeName(queue),
        messageTtl: r.ttl,
      })
    ),
  ])
}

function bindExchangesToQueues(channel: amqp.Channel, policy: IRetryPolicy) {
  const { queue, retries } = policy
  return Promise.all([
    ...retries.map((r, index) =>
      channel.bindQueue(
        `${queue}-retry-${index + 1}-${r.name}`,
        getTTLExchangeName(queue),
        `retry-${index + 1}`
      )
    ),
    channel.bindQueue(queue, getDLXExchangeName(queue), ''),
  ])
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

export function setupRetriesPolicy(
  channel: amqp.Channel,
  policy: IRetryPolicy
) {
  return assertExchanges(channel, policy.queue)
    .then(() => assertQueues(channel, policy))
    .then(() => bindExchangesToQueues(channel, policy))
}

export function getSendMsgToRetryFunc(policy: IRetryPolicy) {
  return ({
    msg,
    channel,
    reasonOfFail,
  }: {
    msg: amqp.ConsumeMessage
    channel: amqp.Channel
    reasonOfFail: Error | string
  }) => {
    const { attempt, content, traceId } = getAttemptAndUpdatedContent(msg)

    channel.ack(msg)

    if (attempt > policy.retries.length) {
      logger.log({
        level: 'error',
        message: `Could not process message ${content.toString()} / channel: ${
          policy.queue
        } / error: ${reasonOfFail}`,
        traceId,
      })
      return
    }

    channel.publish(
      getTTLExchangeName(policy.queue),
      `retry-${attempt}`,
      content,
      {
        persistent: true,
      }
    )
  }
}
