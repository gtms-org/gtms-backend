import mongoose, { Document, Schema } from 'mongoose'
import findOrCreate from 'mongoose-findorcreate'

export interface INotificationsSettings extends Document {
  user: string
  invitation: boolean
  newPostInOwnedGroup: boolean
  newMembershipRequestInOwnedGroup: boolean
  newMemberInOwnedGroup: boolean
  newPostInAdminnedGroup: boolean
  newMembershipRequestInAdminnedGroup: boolean
  newMemberInAdminnedGroup: boolean
  groups: string[]
  users: string[]
}

const NotificationsSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  invitation: {
    type: Boolean,
    required: false,
    default: true,
  },
  newPostInOwnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  newMembershipRequestInOwnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  newMemberInOwnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  newPostInAdminnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  newMembershipRequestInAdminnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  newMemberInAdminnedGroup: {
    type: Boolean,
    required: false,
    default: true,
  },
  groups: {
    type: [Schema.Types.ObjectId],
    required: false,
    default: [],
  },
  users: {
    type: [Schema.Types.ObjectId],
    required: false,
    default: [],
  },
})

NotificationsSettingsSchema.plugin(findOrCreate)

export const NotificationsSettingsModel = mongoose.model<
  INotificationsSettings
>('NotificationsSettings', NotificationsSettingsSchema)
