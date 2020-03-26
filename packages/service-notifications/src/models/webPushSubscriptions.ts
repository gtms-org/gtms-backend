import mongoose, { Document, Schema, HookNextFunction } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import crypto from 'crypto'

export interface IWebPushSubscription extends Document {
  subscription: string
  owner: string
  hash: string
  userAgent: string
}

const WebPushSubscriptionSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  subscription: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
})

WebPushSubscriptionSchema.plugin(uniqueValidator)

WebPushSubscriptionSchema.pre<IWebPushSubscription>('save', function(
  next: HookNextFunction
) {
  if (this.isModified('hash')) {
    this.hash = crypto
      .createHash('md5')
      .update(JSON.stringify(this.subscription))
      .digest('hex')
  }
  next()
})

export default mongoose.model<IWebPushSubscription>(
  'WebPushSubscription',
  WebPushSubscriptionSchema
)
