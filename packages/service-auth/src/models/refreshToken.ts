import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './users'

export interface IRefreshToken extends Document {
  token: string
  user: IUser['_id']
}

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    trim: false,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
})

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
