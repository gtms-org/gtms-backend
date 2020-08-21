import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IOEmbed } from '@gtms/commons'

export interface IComment extends Document {
  post: string
  text: string
  html: string
  oembeds?: IOEmbed[]
  subComments: {
    _id: string
    owner: string
    createdAt: string
    updatedAt: string
    text: string
    html: string
    oembeds?: IOEmbed[]
    tags: string[]
    lastTags: string[]
  }[]
  tags: string[]
  lastTags: string[]
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
        html: String,
        oembeds: [Object],
        tags: [String],
        lastTags: [String],
      },
    ],
    text: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
      trim: true,
    },
    oembeds: {
      type: [Object],
      required: false,
      index: false,
    },
    tags: {
      type: [String],
      required: false,
      index: true,
    },
    lastTags: {
      type: [String],
      required: false,
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
