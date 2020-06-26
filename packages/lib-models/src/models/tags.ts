import mongoose, { Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

export interface ITag extends Document {
  name: string
  creator: string
  membersCounter: number
  postsCounter: number
  groupsCounter: number
  commentsCounter: number
  totalCounter: number
}

const TagSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 255,
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    membersCounter: {
      type: Number,
      default: 0,
    },
    postsCounter: {
      type: Number,
      default: 0,
    },
    groupsCounter: {
      type: Number,
      default: 0,
    },
    commentsCounter: {
      type: Number,
      default: 0,
    },
    totalCounter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

TagSchema.plugin(uniqueValidator)

export const TagModel = mongoose.model<ITag>('Tag', TagSchema)
