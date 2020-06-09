import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IUser } from './users'

export interface IFavGroup extends Document {
  group: string
  owner: IUser
  order: number
}

const FavGroupSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
    group: {
      type: String,
      required: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

FavGroupSchema.plugin(mongoosePaginate)

export const FavGroupModel = mongoose.model<IFavGroup>(
  'FavGroup',
  FavGroupSchema
)
