import amqp from 'amqplib'
import logger from '@gtms/lib-logger'
import sgMail from '@sendgrid/mail'
import { Queues, ISendEmailMsg } from '@gtms/commons'
import {
  setupRetriesPolicy,
  IRetryPolicy,
  getSendMsgToRetryFunc,
} from '@gtms/client-queue'
import config from 'config'

sgMail.setApiKey(config.get<string>('sendgridApiKey'))

const retryPolicy: IRetryPolicy = {
  queue: Queues.sendEmail,
  retries: [
    {
      name: '30s',
      ttl: 30000,
    },
    {
      name: '15m',
      ttl: 900000,
    },
    {
      name: '1h',
      ttl: 3600000,
    },
    {
      name: '3h',
      ttl: 10800000,
    },
    {
      name: '8h',
      ttl: 28800000,
    },
    {
      name: '16h',
      ttl: 57600000,
    },
  ],
}

const sendMsgToRetry = getSendMsgToRetryFunc(retryPolicy)

function processMsg(msg: amqp.Message) {
  return new Promise(async (resolve, reject) => {
    let json: ISendEmailMsg

    try {
      json = JSON.parse(msg.content.toString())
    } catch (err) {
      return reject('can not parse json')
    }

    const {
      to,
      from = config.get<string>('addressEmail'),
      subject,
      text,
      html,
      traceId,
    } = json.data

    try {
      await sgMail.send({
        to,
        from,
        subject,
        text,
        html,
      })

      resolve()

      logger.log({
        level: 'info',
        message: `Email ${subject} to ${to} has been sent`,
        traceId,
      })
    } catch (err) {
      reject('can not send email')
      logger.log({
        level: 'error',
        message: `Can not send email - ${err}`,
        traceId,
      })
    }
  })
}

export async function initSendEmailTask(ch: amqp.Channel) {
  const ok = ch.assertQueue(Queues.sendEmail, { durable: true })

  ok.then(async () => {
    await setupRetriesPolicy(ch, retryPolicy)
    ch.prefetch(1)
  }).then(() => {
    ch.consume(
      Queues.sendEmail,
      msg => {
        if (msg.fields.redelivered) {
          return sendMsgToRetry({
            msg,
            channel: ch,
            reasonOfFail:
              'Message was redelivered, so something wrong happened',
          })
        }

        processMsg(msg)
          .catch(err => {
            sendMsgToRetry({
              msg,
              channel: ch,
              reasonOfFail: err,
            })
          })
          .finally(() => {
            ch.ack(msg)
          })
      },
      {
        noAck: false,
      }
    )
  })
}
