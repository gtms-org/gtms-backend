import {
  NotificationQueueMessageType,
  RecordType,
  NotificationType,
} from '../enums'

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

export interface INotification {
  data: {
    relatedRecordType?: RecordType
    relatedRecordId?: string
    notificationType: NotificationType
    owner: string
    createdAt: string
    updatedAt: string
    payload: any
    traceId: string
  }
}
