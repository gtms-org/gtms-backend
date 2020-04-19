import mongoose, { Document, Schema } from 'mongoose'
import { FileTypes, FileStatus } from '@gtms/commons'
import mongoosePaginate from 'mongoose-paginate'

export interface IFile extends Document {
  title?: string
  fileType: FileTypes
  status: FileStatus
  relatedRecord: string
  files: {
    url: string
    type?: string
    width?: number
    height?: number
  }[]
  owner: string
}

const FileSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: false,
      maxlength: 255,
    },
    fileType: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    relatedRecord: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    files: [
      {
        url: String,
        fileType: String,
        width: Number,
        height: Number,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

FileSchema.plugin(mongoosePaginate)

export default mongoose.model<IFile>('File', FileSchema)
