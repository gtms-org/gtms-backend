import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IUser } from './users'

export interface IFavPost extends Document {
  post: string
  owner: IUser
}

const FavPostSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
    post: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

FavPostSchema.plugin(mongoosePaginate)

export const FavPostModel = mongoose.model<IFavPost>('IFavPost', FavPostSchema)
