import { publishToNotificationsChannel } from '@gtms/client-queue'
import { NotificationQueueMessageType } from '@gtms/commons'

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
