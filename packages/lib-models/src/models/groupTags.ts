import mongoose, { Document, Schema } from 'mongoose'
import { FileStatus } from '@gtms/commons'
import { ITag } from './tags'

export interface IGroupTag extends Document {
  tag: string | ITag
  group: string
  description: string
  order: number
  logo: {
    status: FileStatus
    files: string[]
  }
}

const GroupTagSchema = new Schema({
  tag: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Tag',
  },
  group: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  logo: {
    status: {
      type: String,
    },
    files: {
      type: [String],
    },
  },
})

export const GroupTagModel = mongoose.model<IGroupTag>(
  'GroupTag',
  GroupTagSchema
)
