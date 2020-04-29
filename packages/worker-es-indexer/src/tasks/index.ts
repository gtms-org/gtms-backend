import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import {
  IESGroupMsg,
  IESUserMsg,
  ESIndexUpdateRecord,
  Queues,
} from '@gtms/commons'
import { processUserMsg } from './user'
import { processGroupMsg } from './group'

export function processMsg(msg: amqp.Message): Promise<void> {
  let jsonMsg: IESGroupMsg | IESUserMsg

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.updateESIndex
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  logger.log({
    level: 'info',
    message: `New message in ${Queues.updateESIndex} queue`,
    traceid: jsonMsg.data?.traceId,
  })

  switch (jsonMsg.record) {
    case ESIndexUpdateRecord.group:
      return processGroupMsg(jsonMsg)

    case ESIndexUpdateRecord.user:
      return processUserMsg(jsonMsg)
  }
}
