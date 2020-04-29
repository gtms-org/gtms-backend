import mongoose, { HookNextFunction, Document, Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import { IUser } from './users'

export interface IActivationCode extends Document {
  code: string
  owner: string | IUser
}

const ActivationCodeSchema = new Schema({
  code: {
    type: String,
    required: false,
    unique: true,
    index: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
})

ActivationCodeSchema.plugin(uniqueValidator)

ActivationCodeSchema.pre<IActivationCode>('save', function(
  next: HookNextFunction
) {
  const now = new Date()

  this.code =
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 25) +
    '-' +
    now.getTime()

  next()
})

export const ActivationCodeModel = mongoose.model<IActivationCode>(
  'ActivationCode',
  ActivationCodeSchema
)
