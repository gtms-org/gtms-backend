import mongoose, { HookNextFunction, Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import bcrypt from 'bcryptjs'
import {
  validateEmailAddress,
  validatePassword,
  FileStatus,
} from '@gtms/commons'

export interface IUser extends Document {
  name?: string
  surname?: string
  phone?: string
  email: string
  password: string
  countryCode: string
  languageCode: string
  isBlocked: boolean
  isActive: boolean
  roles: string[]
  groupsMember: string[]
  groupsAdmin: string[]
  avatar?: {
    status: FileStatus
    files: string[]
  }
  gallery?: {
    status: FileStatus
    id?: string
    files: string[]
  }[]
  tags: string[]
}

const saltRounds = 10
const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: false,
    },
    surname: {
      type: String,
      trim: true,
      required: false,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      index: true,
      validate: {
        validator: validateEmailAddress,
        message: props => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: validatePassword,
        message: `Password has to be at least 8 characters,containing at least one number, one lowercase and one uppercase letter`,
      },
    },
    countryCode: {
      type: String,
      trim: true,
      required: false,
      default: 'PL',
    },
    languageCode: {
      type: String,
      trim: true,
      required: false,
      default: 'pl-PL',
    },
    isBlocked: {
      type: Boolean,
      required: false,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: false,
    },
    roles: {
      type: Array,
      required: false,
      default: [],
    },
    groupsMember: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },
    groupsAdmin: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },
    avatar: {
      status: {
        type: String,
      },
      files: {
        type: [String],
      },
    },
    gallery: [
      {
        status: {
          type: String,
        },
        files: {
          type: [String],
        },
      },
    ],
    tags: {
      type: [String],
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.plugin(uniqueValidator)

UserSchema.pre<IUser>('save', function(next: HookNextFunction) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, saltRounds)
  }

  next()
})

export const UserModel = mongoose.model<IUser>('User', UserSchema)
