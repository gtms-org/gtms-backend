import { IEmailNotification } from '@gtms/commons'
import sgMail from '@sendgrid/mail'
import logger from '@gtms/lib-logger'
import config from 'config'

sgMail.setApiKey(config.get<string>('sendgridApiKey'))

export async function sendEmail(data: IEmailNotification) {
  const {
    to,
    from = config.get<string>('addressEmail'),
    subject,
    text,
    html,
    traceId,
  } = data

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
    traceId,
  })
}
