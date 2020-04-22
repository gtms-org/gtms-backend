# gtms-backend

Its a monorepo project for all TS microservices, for details about microservice please read README.md in the package

### Install dependencies

This will install all needed dependencies, globally

```bash
yarn
```

# MONOREPO STRUCTURE
- service-* - working app, microservice
- lib-* - library to use with micoservice, for example logger, or express middlewares
- commons - shared: types, enums, interfaces etc
- client-* - mongodb, queue client, to be used with microservice

# Unit tests

Test coverage at level 80% is mandatory, to run unit tests for a microservice use

```bash
yarn workspace @gtms/service-ADD_NAME_HERE test
```

If you want to run all unit tests, for entire project (all packages) use:

```bash
yarn workspaces run test
```
Please note, that some microservices requires particular setup, like a queue instance in order to run unit tests. Please read README.md file in micoservice folder for details

# Run microservice locally

You can run any microservice locally, on you computer in the watch mode (autoreload) by using this command:

```bash
yarn workspace @gtms/service-ADD_NAME_HERE dev
```
To run service locally you need to setup env variables here, to do that create `.env` file in service folder - you can find there `.env.example` to base on. Read microservice readme for details 

# Build production version

To build prod version of service use:
```bash
yarn workspace @gtms/service-ADD_NAME_HERE build
```

# Run production version
To run prod version of service use:
```bash
yarn workspace @gtms/service-ADD_NAME_HERE start
```
Remember: you have to build it first

# Queue

Package `@gtms/client-queue` exposes common functions to create a queue with retry policy. The policy is describe on the flow diagram below:

![flow](https://raw.githubusercontent.com/gtms-org/gtms-backend/master/docs/queue-flow.png 'Queue Flow')

You have to describe your required policy according to this interface:

```
interface IRetryPolicy {
  queue: string
  retries: {
    name: string
    ttl: number
  }[]
}
```

than, after you created a new channel you need to apply the policy:

```
const ok = ch.assertQueue('exampleQueue', { durable: true })
        ok.then(async () => {
          await setupRetriesPolicy(ch, retryPolicy)
          ch.prefetch(1)
        })
```

it is crucial to setup queue with `noAct: false`

```
ch.consume(
    'exampleQueue',
    msgHandlerFunction,
    {
        noAck: false,
    }
)
```

this means that you have to inform RabbitMQ that message has been processed (successfully or not), for example it can be done like this:

```
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
```

also your job is to send message to retry message exchanger is processing fails, example implementation of `sendMsgToRetry` function:

```
import { getTTLExchangeName } from '@gtms/client-queue'

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
  const maxRetry = 3
  const { attempt, content, traceId } = getAttemptAndUpdatedContent(msg)

  if (attempt > maxRetry) {
    return
  }

  channel.publish(
    getTTLExchangeName('exampleQueue'),
    `retry-${attempt}`,
    content,
    {
      persistent: true,
    }
  )
}
```
