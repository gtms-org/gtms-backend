import mongoose, { Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

export interface IWebPushSubscription extends Document {
  subscription: string
  owner: string
  userAgent: string
  createdAt: string
  updatedAt: string
}

const WebPushSubscriptionSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    subscription: {
      type: String,
      unique: true,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

WebPushSubscriptionSchema.plugin(uniqueValidator)

export const WebPushSubscriptionModel = mongoose.model<IWebPushSubscription>(
  'WebPushSubscription',
  WebPushSubscriptionSchema
)
