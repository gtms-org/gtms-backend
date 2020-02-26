import logger from '@gtms/lib-logger'
import { IActivationCode } from '../models/activationCode'
import { publishToNotificationsChannel } from '@gtms/client-queue'
import { NotificationQueueMessageType } from '@gtms/commons'
import config from 'config'

export default function(
  activationCode: IActivationCode,
  user: { id: string; email: string },
  traceId: string
): void {
  const deleteURL = `${config.get<string>('appDomain')}/delete-account/${
    activationCode.code
  }`

  publishToNotificationsChannel({
    type: NotificationQueueMessageType.email,
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
}
