import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

export interface IPost extends Document {
  group: string
  text: string
  tags: string[]
  owner: string
  commentsCounter: number
  application: string
  createdAt: string
  updatedAt: string
}

const PostSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    commentsCounter: {
      type: Number,
      required: false,
      default: 0,
    },
    application: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

PostSchema.plugin(mongoosePaginate)

export const PostModel = mongoose.model<IPost>('Post', PostSchema)
