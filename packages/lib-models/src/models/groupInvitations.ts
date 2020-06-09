import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IGroup } from './groups'

export interface IGroupInvitation extends Document {
  group: IGroup
  user: string
  type: 'invitation' | 'request'
  code?: string
  createdAt: string
  updatedAt: string
}

const GroupInvitationSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Group',
    },
    user: {
      type: String,
      required: false,
      index: true,
    },
    type: {
      type: String,
      index: true,
      enum: ['invitation', 'request'],
      required: true,
    },
    code: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

GroupInvitationSchema.plugin(mongoosePaginate)

export const GroupInvitationModel = mongoose.model<IGroupInvitation>(
  'GroupInvitation',
  GroupInvitationSchema
)
