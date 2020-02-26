import { NotificationQueueMessageType } from '../enums'

export interface IEmailNotification {
  to: string
  from?: string
  subject: string
  text: string
  html: string
  traceId: string
}

export interface INotificationQueueMsg {
  type: NotificationQueueMessageType
  data: IEmailNotification
}

export interface IDeleteAccountQueueMsg {
  id: string
  traceId: string
}
