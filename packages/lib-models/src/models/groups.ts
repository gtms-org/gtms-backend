import mongoose, { Document, Schema, HookNextFunction } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import mongoosePaginate from 'mongoose-paginate'
import slugify from '@sindresorhus/slugify'
import { FileStatus } from '@gtms/commons'

export enum BGTypes {
  file = 'file',
  background1 = 'background1',
  background2 = 'background2',
  background3 = 'background3',
  background4 = 'background4',
  background5 = 'background5',
  background6 = 'background6',
  background7 = 'background7',
  background8 = 'background8',
  background9 = 'background9',
  background10 = 'background10',
  background11 = 'background11',
}

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
  bgType: BGTypes
  tags?: string[]
  admins?: string[]
  owner: string
  postsCounter: number
  membersCounter: number
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
    bgType: {
      type: String,
      enum: [
        BGTypes.file,
        BGTypes.background1,
        BGTypes.background2,
        BGTypes.background3,
        BGTypes.background4,
        BGTypes.background5,
        BGTypes.background6,
        BGTypes.background7,
        BGTypes.background8,
        BGTypes.background9,
        BGTypes.background10,
        BGTypes.background11,
      ],
      default: BGTypes.background1,
    },
    tags: {
      type: [String],
      required: false,
      index: true,
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
    membersCounter: {
      type: Number,
      required: false,
      default: 0,
    },
    postsCounter: {
      type: Number,
      required: false,
      default: 0,
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
