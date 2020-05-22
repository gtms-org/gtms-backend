import { IDescreaseGroupPostsCounterMsg } from '@gtms/commons'
import { GroupModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processDescreasedPostsCounterMsg = (
  msg: IDescreaseGroupPostsCounterMsg
) =>
  new Promise((resolve, reject) => {
    const {
      data: { group, traceId },
    } = msg

    GroupModel.updateOne(
      {
        _id: group,
      },
      { $inc: { postsCounter: -1 } }
    )
      .then(({ nModified }) => {
        if (nModified > 0) {
          logger.log({
            level: 'info',
            message: `Posts counter for group ${group} has been descreased`,
            traceId,
          })
        } else {
          logger.log({
            level: 'warn',
            message: `Can not modify posts counter, group ${group} not found`,
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
