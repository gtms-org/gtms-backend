import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

export interface IComment extends Document {
  post: string
  text: string
  lastSubComments: {
    owner: string
    createdAt: string
    updatedAt: string
    text: string
  }[]
  parent?: IComment
  tags: string[]
  owner: string
}

const CommentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    lastSubComments: [
      {
        owner: String,
        createdAt: String,
        updatedAt: String,
        text: String,
      },
    ],
    text: {
      type: String,
      required: true,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Comment',
    },
    tags: {
      type: [String],
      required: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

CommentSchema.plugin(mongoosePaginate)

export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema)
