import { listenToNotificationQueue } from '.'
import sgMail from '@sendgrid/mail'
import { publishToNotificationsChannel } from '@gtms/client-queue'
import { NotificationQueueMessageType } from '@gtms/commons'

jest.mock('@sendgrid/mail', () =>
  jest.fn().mockImplementation(() => Promise.resolve())
)

describe('Worker', () => {
  beforeAll(async () => {
    await listenToNotificationQueue()
  })

  it('Should send an email after receiving a new queue message', async done => {
    publishToNotificationsChannel({
      type: NotificationQueueMessageType.email,
      data: {
        to: 'fake@user.com',
        subject: 'Activate your account',
        text: `Click on this link to activate your account link`,
        html: `Click on this link to activate your account`,
        traceId: 'fake-trace-id',
      },
    })

    setTimeout(() => {
      expect(sgMail).toBeCalledTimes(1)

      done()
    }, 300)
  })
})
