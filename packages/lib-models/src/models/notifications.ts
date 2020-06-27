import mongoose, { Document, Schema } from 'mongoose'
import { RecordType, NotificationType } from '@gtms/commons'
import mongoosePaginate from 'mongoose-paginate'

export interface INotification extends Document {
  relatedRecordType?: RecordType
  relatedRecordId?: string
  notificationType: NotificationType
  owner: string
  createdAt: string
  updatedAt: string
  payload: any
}

const NotificationSchema = new Schema(
  {
    relatedRecordType: {
      type: String,
      index: true,
      required: false,
    },
    relatedRecordId: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    notificationType: {
      type: String,
      index: false,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    payload: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.plugin(mongoosePaginate)

export const NotificationModel = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
)
