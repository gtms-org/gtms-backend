import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './users'

export enum AbuseReportStatus {
  new = 'new',
  confirmed = 'confirmed',
  rejected = 'rejected',
}

export interface IAbuseReport extends Document {
  group: string
  post?: string
  comment?: string
  text: string
  html: string
  owner: string | IUser
  reporter: string | IUser
  moderator?: string | IUser
  reason: string
  substantiation: string
  status: AbuseReportStatus
  confirmationDecision?: string
  createdAt: string
  updatedAt: string
}

const AbuseReportSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      required: false,
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
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    moderator: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    reason: {
      type: String,
      index: false,
      required: true,
    },
    status: {
      type: String,
      index: true,
      required: false,
      default: AbuseReportStatus.new,
    },
    substantiation: {
      type: String,
      index: false,
      required: false,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmationDecision: {
      type: String,
      index: false,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

export const AbuseReportModel = mongoose.model<IAbuseReport>(
  'AbuseReport',
  AbuseReportSchema
)
