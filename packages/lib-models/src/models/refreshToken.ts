import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './users'

export interface IRefreshToken extends Document {
  token: string
  user: IUser['_id']
  ipAddress: string
  userAgent: string
}

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    trim: false,
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  ipAddress: {
    type: String,
    required: true,
    index: true,
  },
  userAgent: {
    type: String,
    required: true,
    index: true,
  },
})

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
)
