import { FileTypes, FileStatus } from '../enums'

export interface IFileQueueMsg {
  // this should be in sync with file model from @gtms/service-files
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
    owner: string
    traceId: string
  }
}
