import { IUpdateGroupTagsMsq } from '@gtms/commons'
import { GroupModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processUpdateGroupTagsMsg = (msg: IUpdateGroupTagsMsq) =>
  new Promise((resolve, reject) => {
    const {
      data: { group, traceId, tags },
    } = msg

    GroupModel.updateOne(
      {
        _id: group,
      },
      { $addToSet: { tags: { $each: tags } } }
    )
      .then(({ nModified }) => {
        if (nModified > 0) {
          logger.log({
            level: 'info',
            message: `Tags list for group ${group} has been updated`,
            traceId,
          })
        } else {
          logger.log({
            level: 'warn',
            message: `Can not modify tags list, group ${group} not found`,
            traceId,
          })
        }

        resolve()
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })

        return reject('database error')
      })
  })
