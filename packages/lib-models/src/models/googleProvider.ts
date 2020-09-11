import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './users'
import findOrCreate from 'mongoose-findorcreate'

export interface IGoogleProvider extends Document {
  id: string
  name: string
  user: IUser['_id']
}

const GoogleProviderSchema = new Schema({
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

GoogleProviderSchema.plugin(findOrCreate)

export const GoogleProviderModel = mongoose.model<IGoogleProvider>(
  'GoogleProvider',
  GoogleProviderSchema
)
