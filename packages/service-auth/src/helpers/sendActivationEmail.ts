import { IUser, ActivationCodeModel, IActivationCode } from '@gtms/lib-models'
import { publishOnChannel } from '@gtms/client-queue'
import { ISendEmailMsg, Queues } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import config from 'config'

export default function(user: IUser, traceId: string): void {
  ActivationCodeModel.create({
    owner: user,
  })
    .then(async (activationCode: IActivationCode) => {
      const activationURL = `https://${config.get<string>(
        'appDomain'
      )}/activate-account/${activationCode.code}`

      try {
        await publishOnChannel<ISendEmailMsg>(Queues.sendEmail, {
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
