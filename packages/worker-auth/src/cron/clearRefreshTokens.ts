import { RefreshTokenModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import config from 'config'

export function clearOutdatedRefreshTokens() {
  RefreshTokenModel.deleteMany({
    createdAt: {
      $lt: new Date(
        Date.now() - (config.get<number>('refreshTokenLife') - 1) * 1000
      ),
    },
  })
    .then(({ deletedCount }) => {
      logger.log({
        level: 'info',
        message: `${deletedCount} refreshTokens removed from DB by cron job`,
      })
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `Can not remove old refreshTokens by cron job, database error - ${err}`,
      })
    })
}
