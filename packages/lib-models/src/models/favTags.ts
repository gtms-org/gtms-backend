import mongoose, { Document, Schema } from 'mongoose'
import { ITag } from './tags'
import { IGroupTag } from './groupTags'

export enum FavTagType {
  tag = 'tag',
  groupTag = 'groupTag',
}
export interface IFavTag extends Document {
  tag?: ITag
  groupTag?: IGroupTag
  owner: string
  group: string
  type: FavTagType
  createdAt: string
  updatedAt: string
}

const FavTagSchema = new Schema(
  {
    tag: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Tag',
    },
    groupTag: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'GroupTag',
    },
    type: {
      type: String,
      required: true,
      enum: [FavTagType.groupTag, FavTagType.tag],
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
