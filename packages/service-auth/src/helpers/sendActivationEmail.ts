import { IUser } from '../models/users'
import activationCodeModel, { IActivationCode } from '../models/activationCode'
import { publishToNotificationsChannel } from '@gtms/client-queue'
import { NotificationQueueMessageType } from '@gtms/commons'
import logger from '@gtms/lib-logger'

const { APP_DOMAIN } = process.env

export default function(user: IUser, traceId: string): void {
  activationCodeModel
    .create({
      owner: user,
    })
    .then(async (activationCode: IActivationCode) => {
      const activationURL = `${APP_DOMAIN}/activate-account/${activationCode.code}`

      try {
        await publishToNotificationsChannel({
          type: NotificationQueueMessageType.email,
          data: {
            to: user.email,
            subject: 'Activate your account',
            text: `Click on this link to activate your account link ${activationURL}`,
            html: `Click on this link to activate your account <a href="${activationURL}">${activationURL}</a>`,
            traceId,
          },
        })
      } catch (err) {
        logger.log({
          message: `Can not publish message to the QUEUE: ${err}`,
          level: 'error',
          traceId,
        })
      }
    })
    .catch(err => {
      logger.log({
        message: `Can not create activation code record ${err}`,
        level: 'error',
        traceId,
      })
    })
}
