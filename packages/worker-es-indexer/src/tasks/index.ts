import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import {
  IESGroupMsg,
  IESUserMsg,
  IESPostMsg,
  IESCommentMsg,
  ESIndexUpdateRecord,
  Queues,
} from '@gtms/commons'
import { processUserMsg } from './user'
import { processGroupMsg } from './group'
import { processPostMsg } from './post'
import { processCommentMsg } from './comment'

export function processMsg(msg: amqp.Message): Promise<void> {
  let jsonMsg: IESGroupMsg | IESUserMsg | IESPostMsg | IESCommentMsg

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

    case ESIndexUpdateRecord.post:
      return processPostMsg(jsonMsg)

    case ESIndexUpdateRecord.comment:
      return processCommentMsg(jsonMsg)

    default:
      logger.log({
        level: 'error',
        message: `Not supported message: ${msg.content.toString()} in ${
          Queues.updateESIndex
        }`,
        traceid: (jsonMsg as any).data?.traceId,
      })
      break
  }
}
