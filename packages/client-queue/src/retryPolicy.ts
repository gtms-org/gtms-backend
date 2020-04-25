import amqp from 'amqplib'

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

export function setupRetriesPolicy(
  channel: amqp.Channel,
  policy: IRetryPolicy
) {
  return assertExchanges(channel, policy.queue)
    .then(() => assertQueues(channel, policy))
    .then(() => bindExchangesToQueues(channel, policy))
}
