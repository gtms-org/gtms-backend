import { RecordType, NotificationType } from '../enums'

export interface ISendEmailMsg {
  data: {
    to: string
    from?: string
    subject: string
    text: string
    html: string
    traceId: string
  }
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
    payload?: any
    traceId: string
  }
}
