import { IUserGotGroupAdminRights } from '@gtms/commons'
import { UserModel, IUser } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processGotGroupAdminRightsMsg = (msg: IUserGotGroupAdminRights) =>
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
