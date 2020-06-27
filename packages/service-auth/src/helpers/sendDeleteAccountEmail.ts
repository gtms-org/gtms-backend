import logger from '@gtms/lib-logger'
import { IActivationCode } from '@gtms/lib-models'
import { publishOnChannel } from '@gtms/client-queue'
import { ISendEmailMsg, Queues } from '@gtms/commons'
import config from 'config'

export default async function(
  activationCode: IActivationCode,
  user: { id: string; email: string },
  traceId: string
): Promise<void> {
  const deleteURL = `${config.get<string>('appDomain')}/delete-account/${
    activationCode.code
  }`

  try {
    await publishOnChannel<ISendEmailMsg>(Queues.sendEmail, {
      data: {
        to: user.email,
        subject: 'Delete your account',
        text: `Click on this link to DELETE your account link ${deleteURL}`,
        html: `Click on this link to DELETE your account <a href="${deleteURL}">${deleteURL}</a>`,
        traceId,
      },
    })

    logger.log({
      message: `Delete account email for user ${user.id} (${user.email}) has been sent`,
      level: 'info',
      traceId,
    })
  } catch (err) {
    logger.log({
      message: `Can not send delete account email for ${user.id} (${user.email}) - ${err}`,
      level: 'error',
      traceId,
    })
  }
}
