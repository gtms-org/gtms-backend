import { ActivationCodeModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export function clearOutdatedActivationCodes() {
  ActivationCodeModel.deleteMany({
    createdAt: {
      $lt: new Date(
        Date.now() - 1209600000 // 2 weeks
      ),
    },
  })
    .then(({ deletedCount }) => {
      logger.log({
        level: 'info',
        message: `${deletedCount} outdated activation codes removed from DB by cron job`,
      })
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `Can not remove old activation codes using cron job, database error - ${err}`,
      })
    })
}
