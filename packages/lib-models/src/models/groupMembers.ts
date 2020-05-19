import mongoose, { Document, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import { IGroup } from './groups'

export interface IGroupMember extends Document {
  group: IGroup
  user: string
}

const GroupMemberSchema = new Schema(
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
  },
  {
    timestamps: true,
  }
)

GroupMemberSchema.plugin(mongoosePaginate)

export const GroupMemberModel = mongoose.model<IGroupMember>(
  'GroupMember',
  GroupMemberSchema
)
