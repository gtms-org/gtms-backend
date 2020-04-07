import { CreateUpdateGroupQueueMessageType } from '../enums'

export interface IGroupQueueMsg {
  type: CreateUpdateGroupQueueMessageType
  // this should be in sync with group model from @gtms/service-groups
  data: {
    name: string
    slug: string
    description?: string
    type: 'public' | 'private'
    visibility: 'public' | 'private'
    avatar?: string
    tags?: string[]
    members?: string[]
    owner: string
    traceId: string
  }
}
