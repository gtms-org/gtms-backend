import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './users'
import findOrCreate from 'mongoose-findorcreate'

export interface IFacebookProvider extends Document {
  accessToken: string
  id: string
  name: string
  user: IUser['_id']
}

const FacebookProviderSchema = new Schema({
  accessToken: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
})

FacebookProviderSchema.plugin(findOrCreate)

export default mongoose.model<IFacebookProvider>(
  'FacebookProvider',
  FacebookProviderSchema
)
