import mongoose, { Document, Schema, HookNextFunction } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import mongoosePaginate from 'mongoose-paginate'
import slugify from '@sindresorhus/slugify'
import { FileStatus } from '@gtms/commons'

export interface IGroup extends Document {
  name: string
  slug: string
  description?: string
  type: 'public' | 'private'
  visibility: 'public' | 'private'
  avatar?: {
    status: FileStatus
    files: string[]
  }
  bg?: {
    status: FileStatus
    files: string[]
  }
  tags?: string[]
  admins?: string[]
  owner: string
}

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 255,
    },
    slug: {
      type: String,
      trim: true,
      required: false,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: false,
      maxlength: 1024,
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    avatar: {
      status: {
        type: String,
      },
      files: {
        type: [String],
      },
    },
    bg: {
      status: {
        type: String,
      },
      files: {
        type: [String],
      },
    },
    tags: {
      type: [String],
      required: false,
    },
    admins: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
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

GroupSchema.plugin(uniqueValidator)
GroupSchema.plugin(mongoosePaginate)

GroupSchema.pre<IGroup>('save', function(next: HookNextFunction) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name)
  }

  next()
})

export const GroupModel = mongoose.model<IGroup>('Group', GroupSchema)
