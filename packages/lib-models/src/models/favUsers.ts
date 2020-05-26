import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IUser } from './users'

export interface IFavUser extends Document {
  user: IUser
  owner: IUser
}

const FavUserSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

FavUserSchema.plugin(mongoosePaginate)

export const FavUserModel = mongoose.model<IFavUser>('FavUser', FavUserSchema)
