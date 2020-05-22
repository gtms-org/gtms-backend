import { IDescreaseUserPostsCounterMsg } from '@gtms/commons'
import { UserModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export const processDescreasedPostsCounterMsg = (
  msg: IDescreaseUserPostsCounterMsg
) =>
  new Promise((resolve, reject) => {
    const {
      data: { user, traceId },
    } = msg

    UserModel.updateOne(
      {
        _id: user,
      },
      { $inc: { postsCounter: -1 } }
    )
      .then(({ nModified }) => {
        if (nModified > 0) {
          logger.log({
            level: 'info',
            message: `Posts counter for user ${user} has been descreased`,
            traceId,
          })
        } else {
          logger.log({
            level: 'warn',
            message: `Can not modify posts counter, user ${user} not found`,
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
