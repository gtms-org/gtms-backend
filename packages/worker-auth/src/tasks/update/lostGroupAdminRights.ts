import { IUserLostGroupAdminRights } from '@gtms/commons'
import { UserModel, IUser } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processLostGroupAdminRightsMsg = (
  msg: IUserLostGroupAdminRights
) =>
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
