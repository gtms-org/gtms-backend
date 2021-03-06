import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { ISerializedComment, IOEmbed, FileStatus } from '@gtms/commons'

export interface IPost extends Document {
  group: string
  text: string
  html: string
  oembeds?: IOEmbed[]
  tags: string[]
  lastTags: string[]
  followers: string[]
  mentioned: string[]
  favs: string[]
  owner: string
  commentsCounter: number
  firstComments: ISerializedComment[]
  application: string
  createdAt: string
  updatedAt: string
  images?: {
    status: FileStatus
    files: string[]
  }[]
}

const PostSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
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
    firstComments: [
      {
        id: String,
        text: String,
        html: String,
        tags: [String],
        owner: String,
        createdAt: Date,
        updatedAt: Date,
      },
    ],
    commentsCounter: {
      type: Number,
      required: false,
      default: 0,
    },
    application: {
      type: String,
      required: false,
    },
    followers: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },
    mentioned: {
      type: [Schema.Types.ObjectId],
      required: false,
      index: true,
      default: [],
    },
    favs: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },
    images: {
      type: [
        {
          status: String,
          files: [String],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
)

PostSchema.plugin(mongoosePaginate)

export const PostModel = mongoose.model<IPost>('Post', PostSchema)
