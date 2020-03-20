import mongoose, { Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import mongoosePaginate from 'mongoose-paginate'

export interface IGroup extends Document {
  name: string
  description?: string
  type: 'public' | 'private'
  visibility: 'public' | 'private'
  avatar?: string
  tags?: string[]
  members?: string[]
  owner: string
}

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    members: {
      type: [String],
      required: false,
    },
    owner: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

GroupSchema.plugin(uniqueValidator)
GroupSchema.plugin(mongoosePaginate)

export default mongoose.model<IGroup>('Group', GroupSchema)
