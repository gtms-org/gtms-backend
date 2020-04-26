import amqp from 'amqplib'
import config from 'config'
import logger from '@gtms/lib-logger'
import {
  Queues,
  CreateUpdateGroupQueueMessageType,
  IGroupQueueMsg,
  GROUPS_INDEX,
} from '@gtms/commons'
import { Client, RequestParams } from '@elastic/elasticsearch'
import bodyParser from 'body-parser'

const client: Client = new Client({
  node: `http://${config.get<string>('esHost')}:${config.get<number>(
    'esPort'
  )}`,
})

function processMsg(msg: amqp.Message) {
  const jsonMessage: IGroupQueueMsg = JSON.parse(msg.content.toString())

  logger.log({
    level: 'info',
    message: `New message in ${Queues.createUpdateGroup} queue`,
    traceid: jsonMessage.data?.traceId,
  })

  switch (jsonMessage.type) {
    case CreateUpdateGroupQueueMessageType.create: {
      const dataToIndex: RequestParams.Index = {
        index: GROUPS_INDEX,
        body: jsonMessage.data,
      }

      client.index(dataToIndex).then(response => {
        logger.log({
          level: 'info',
          message: `Elasticserach indexed ${dataToIndex}: ${response}`,
        })
      })
      return
    }
    case CreateUpdateGroupQueueMessageType.update: {
      const dataToUpdate: RequestParams.UpdateByQuery = {
        index: GROUPS_INDEX,
        refresh: true,
        body: {
          script: {
            inline: "for (i in params.keySet()) { ctx._source[i] = params.get(i);}",
            lang: "painless",
              params: jsonMessage.data
          },
          query: {
            match: {
              slug: jsonMessage.data.slug
            }
          }
        }
      }
      client.updateByQuery(dataToUpdate).then(response => {
        logger.log({
          level: 'info',
          message: `Elasticserach updated group ${dataToUpdate}: ${response}`,
        })
      })
      return
    }
    default:
      logger.log({
        level: 'error',
        message: `Not supported message in the queue ${
          Queues.createUpdateGroup
        } - ${msg.content.toString()}`,
        traceid: jsonMessage.data?.traceId,
      })
      break
  }
}

let queueConnection: amqp.Connection

export async function listenToGroupsQueue() {
  await amqp
    .connect(`amqp://${config.get<string>('queueHost')}`)
    .then(async conn => {
      await conn.createChannel().then(ch => {
        queueConnection = conn
        const ok = ch.assertQueue(Queues.createUpdateGroup, { durable: true })
        ok.then(() => {
          ch.prefetch(1)
        }).then(() => {
          ch.consume(Queues.createUpdateGroup, processMsg, {
            noAck: true,
          })
        })
      })
    })
}

export function closeConnection() {
  queueConnection && queueConnection.close()
}
