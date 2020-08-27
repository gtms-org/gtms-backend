import mongoose, { Document, Schema } from 'mongoose'

export interface ITmpFile extends Document {
  owner: string
  file: string
  bucket: string
  url: string
  relatedRecordType?: string
  createdAt: string
  updatedAt: string
}

const TmpFileSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    file: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    relatedRecordType: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

export const TmpFileModel = mongoose.model<ITmpFile>('TmpFile', TmpFileSchema)
