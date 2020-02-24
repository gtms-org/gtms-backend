import mongoose, { HookNextFunction, Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import bcrypt from 'bcrypt'

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
      validate: {
        validator: (v: string) => {
          const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
          return re.test(v)
        },
        message: props => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
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
  },
  {
    timestamps: true,
  }
)

UserSchema.plugin(uniqueValidator)

UserSchema.pre<IUser>('save', function(next: HookNextFunction) {
  this.password = bcrypt.hashSync(this.password, saltRounds)
  next()
})

export default mongoose.model<IUser>('User', UserSchema)
