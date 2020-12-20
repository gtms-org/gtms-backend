import { IActivationCode, ActivationCodeModel, IUser } from '@gtms/lib-models'
import { publishOnChannel } from '@gtms/client-queue'
import { ISendEmailMsg, Queues } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import config from 'config'

export default function(user: IUser, traceId: string): void {
  ActivationCodeModel.create({
    owner: user,
  })
    .then((activationCode: IActivationCode) => {
      const activationURL = `https://${config.get<string>(
        'appDomain'
      )}/reset-password/${activationCode.code}`

      publishOnChannel<ISendEmailMsg>(Queues.sendEmail, {
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
