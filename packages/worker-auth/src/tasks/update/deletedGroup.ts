import { IUserDeletedGroupMsg } from '@gtms/commons'
import { UserModel, IUser } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processDeletedGroupMsg = (msg: IUserDeletedGroupMsg) =>
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

    const groups: string[] = userObj.groupsOwner
    const index = groups.findIndex(g => g === group)

    if (index === -1) {
      // user does not own the group
      logger.log({
        level: 'warn',
        message: `User ${user} does not own group ${group}, skipping removal operation`,
        traceId,
      })
      return resolve()
    }

    groups.splice(index, 1)

    userObj.groupsOwner = groups

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
      message: `User ${user} has been removed from group ${group} as owner`,
      traceId,
    })

    resolve()
  })
