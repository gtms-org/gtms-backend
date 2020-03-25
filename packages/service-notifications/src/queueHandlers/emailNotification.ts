import sgMail from '@sendgrid/mail'
import logger from '@gtms/lib-logger'
import { IEmailNotification } from '@gtms/commons'
import config from 'config'

sgMail.setApiKey(config.get<string>('sendgridApiKey'))

export default async function(msg: IEmailNotification) {
  const {
    to,
    from = config.get<string>('addressEmail'),
    subject,
    text,
    html,
  } = msg

  await sgMail.send({
    to,
    from,
    subject,
    text,
    html,
  })

  logger.log({
    level: 'info',
    message: `Email ${subject} to ${to} has been sent`,
  })
}
