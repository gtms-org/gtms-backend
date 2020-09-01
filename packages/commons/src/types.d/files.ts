import { FileTypes, FileStatus } from '../enums'

export interface IFileQueueMsg {
  data: {
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
    extra?: any
    owner: string
    traceId: string
  }
}

export interface IDeleteFileQueueMsg {
  data: {
    bucket: string
    file: string
    traceId: string
  }
}
