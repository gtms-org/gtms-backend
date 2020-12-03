import { RecordType } from '../enums'

export interface ITagsUpdateMsg {
  recordType: RecordType
  data: {
    tags: string[]
    traceId: string
    owner: string
    group?: string
  }
}
