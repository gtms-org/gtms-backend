import { IActivationCode, ActivationCodeModel, IUser } from '@gtms/lib-models'
import { publishToNotificationsChannel } from '@gtms/client-queue'
import { NotificationQueueMessageType } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import config from 'config'

export default function(user: IUser, traceId: string): void {
  ActivationCodeModel.create({
    owner: user,
  })
    .then((activationCode: IActivationCode) => {
      const activationURL = `${config.get<string>('appDomain')}/change-pass/${
        activationCode.code
      }`

      publishToNotificationsChannel({
        type: NotificationQueueMessageType.email,
        data: {
          to: user.email,
          subject: 'Change password to your account',
          text: `Click on this link to change password to your account ${activationURL}. If you did not requested password change, simple ignore this email`,
          html: `Click on this link to change password to your account <a href="${activationURL}">${activationURL}</a>. If you did not requested password change, simple ignore this email`,
          traceId,
        },
      })

      logger.log({
        level: 'info',
        message: `Remind password for user ${user._id}, ${user.email} has been sent`,
        traceId,
      })
    })
    .catch(err => {
      logger.log({
        message: `Can not create activation code record ${err}`,
        level: 'error',
        traceId,
      })
    })
}
