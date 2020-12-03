import mongoose, { Document, Schema } from 'mongoose'
import { ITag } from './tags'

export interface IFavTag extends Document {
  tag: ITag
  owner: string
  group: string
}

const FavTagSchema = new Schema(
  {
    tag: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'tag',
    },
    owner: {
      type: String,
      required: false,
      index: true,
    },
    group: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

export const FavTagModel = mongoose.model<IFavTag>('FavTag', FavTagSchema)
