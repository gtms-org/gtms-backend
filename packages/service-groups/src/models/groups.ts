import mongoose, { Document, Schema, HookNextFunction } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import mongoosePaginate from 'mongoose-paginate'
import slugify from '@sindresorhus/slugify'

export interface IGroup extends Document {
  name: string
  slug: string
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

GroupSchema.pre<IGroup>('save', function(next: HookNextFunction) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name)
  }

  next()
})

export default mongoose.model<IGroup>('Group', GroupSchema)
