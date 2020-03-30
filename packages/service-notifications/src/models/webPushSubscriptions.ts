import mongoose, { Document, Schema, HookNextFunction } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import crypto from 'crypto'

export interface IWebPushSubscription extends Document {
  subscription: string
  owner: string
  hash: string
  userAgent: string
}
/**
 * @swagger
 *  components:
 *    schemas:
 *       WebPushSubscription:
 *         type: object
 *         required:
 *           - owner
 *           - subscription
 *           - userAgent
 *         properties:
 *           owner:
 *             type: string
 *           subscription:
 *             type: string
 *           userAgent:
 *             type: string
 */
const WebPushSubscriptionSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  hash: {
    type: String,
    unique: true,
    index: true,
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
})

WebPushSubscriptionSchema.plugin(uniqueValidator)

WebPushSubscriptionSchema.pre<IWebPushSubscription>('save', function(
  next: HookNextFunction
) {
  if (this.isModified('subscription')) {
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
