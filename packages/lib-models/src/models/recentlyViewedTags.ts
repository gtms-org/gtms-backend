import mongoose, { Document, Schema } from 'mongoose'
import { ITag } from './tags'

export interface IRecentlyViewedTag extends Document {
  tag: ITag
  owner: string
  group: string
  createdAt: string
  updatedAt: string
}

const RecentlyViewedTagSchema = new Schema(
  {
    tag: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Tag',
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    group: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

export const RecentlyViewedTagModel = mongoose.model<IRecentlyViewedTag>(
  'RecentlyViewedTag',
  RecentlyViewedTagSchema
)
