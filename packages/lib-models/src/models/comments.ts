import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

export interface IComment extends Document {
  post: string
  text: string
  subComments: {
    _id: string
    owner: string
    createdAt: string
    updatedAt: string
    text: string
    tags: string[]
  }[]
  tags: string[]
  owner: string
  createdAt: string
  updatedAt: string
}

const CommentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    subComments: [
      {
        owner: String,
        createdAt: Date,
        updatedAt: Date,
        text: String,
        tags: [String],
      },
    ],
    text: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: false,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

CommentSchema.plugin(mongoosePaginate)

export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema)
