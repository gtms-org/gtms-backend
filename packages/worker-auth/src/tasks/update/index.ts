import amqp from 'amqplib'
import {
  Queues,
  IUserUpdateMsg,
  UserUpdateTypes,
  IUserJoinedGroupMsg,
  IUserLeftGroupMsg,
  IUserGotGroupAdminRights,
  IUserLostGroupAdminRights,
} from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'
import logger from '@gtms/lib-logger'
import { UserModel, IUser } from '@gtms/lib-models'

const retryPolicy: IRetryPolicy = {
  queue: Queues.userUpdate,
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

const processJoinedGroupMsg = (msg: IUserJoinedGroupMsg) =>
  new Promise(async (resolve, reject) => {
    const { data: { group, user, traceId } = {} } = msg

    let userObj: IUser | null

    try {
      userObj = await UserModel.findOne({ _id: user })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    const groups: string[] = userObj.groupsMember

    if (groups.includes(group)) {
      // user is already a group member

      logger.log({
        level: 'warn',
        message: `User ${user} already belongs to group ${group}, skipping adding operation`,
        traceId,
      })

      return resolve()
    }

    groups.push(group)

    userObj.groupsMember = groups

    try {
      await userObj.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    logger.log({
      level: 'info',
      message: `User ${user} has been added to group ${group}`,
      traceId,
    })

    resolve()
  })

const processLeftGroupMsg = (msg: IUserLeftGroupMsg) =>
  new Promise(async (resolve, reject) => {
    const { data: { group, user, traceId } = {} } = msg

    let userObj: IUser | null

    try {
      userObj = await UserModel.findOne({ _id: user })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    const groups: string[] = userObj.groupsMember
    const index = groups.findIndex(g => g === group)

    if (index === -1) {
      // user does not belong to the group
      logger.log({
        level: 'warn',
        message: `User ${user} does not belong to group ${group}, skipping removal operation`,
        traceId,
      })
      return resolve()
    }

    groups.splice(index, 1)

    userObj.groupsMember = groups

    try {
      await userObj.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    logger.log({
      level: 'info',
      message: `User ${user} has been removed from group ${group}`,
      traceId,
    })

    resolve()
  })

const processGotGroupAdminRightsMsg = (msg: IUserGotGroupAdminRights) =>
  new Promise(async (resolve, reject) => {
    const { data: { group, user, traceId } = {} } = msg

    let userObj: IUser | null

    try {
      userObj = await UserModel.findOne({ _id: user })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    const groups: string[] = userObj.groupsAdmin

    if (groups.includes(group)) {
      // user is already a group's admin

      logger.log({
        level: 'warn',
        message: `User ${user} is already group's ${group} admin, skipping adding operation`,
        traceId,
      })

      return resolve()
    }

    groups.push(group)

    userObj.groupsAdmin = groups

    try {
      await userObj.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    logger.log({
      level: 'info',
      message: `User ${user} has been added to group ${group} as admin`,
      traceId,
    })

    resolve()
  })

const processLostGroupAdminRightsMsg = (msg: IUserLostGroupAdminRights) =>
  new Promise(async (resolve, reject) => {
    const { data: { group, user, traceId } = {} } = msg

    let userObj: IUser | null

    try {
      userObj = await UserModel.findOne({ _id: user })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    const groups: string[] = userObj.groupsAdmin
    const index = groups.findIndex(g => g === group)

    if (index === -1) {
      // user is not group's admin
      logger.log({
        level: 'warn',
        message: `User ${user} is not admin in group ${group}, skipping removal operation`,
        traceId,
      })
      return resolve()
    }

    groups.splice(index, 1)

    userObj.groupsAdmin = groups

    try {
      await userObj.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId,
      })

      return reject('database error')
    }

    logger.log({
      level: 'info',
      message: `User ${user} lost admin rights from group ${group}`,
      traceId,
    })

    resolve()
  })

const processMsg = (msg: amqp.Message) => {
  let jsonMsg: IUserUpdateMsg

  try {
    jsonMsg = JSON.parse(msg.content.toString())
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Can not parse ${
        Queues.userUpdate
      } queue message: ${msg.content.toString()} / error: ${err}`,
    })
    return Promise.reject(`can not parse json`)
  }

  switch (jsonMsg.type) {
    case UserUpdateTypes.joinedGroup:
      return processJoinedGroupMsg(jsonMsg)

    case UserUpdateTypes.leftGroup:
      return processLeftGroupMsg(jsonMsg)

    case UserUpdateTypes.gotGroupAdminRights:
      return processGotGroupAdminRightsMsg(jsonMsg)

    case UserUpdateTypes.lostGroupAdminRights:
      return processLostGroupAdminRightsMsg(jsonMsg)
  }
}

export function initUpdateTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.userUpdate, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.userUpdate,
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
