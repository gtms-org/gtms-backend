import { GroupUpdateTypes } from '../enums'

export interface IIncreaseGroupPostsCounterMsg {
  type: GroupUpdateTypes.increasePostsCounter
  data: {
    group: string
    traceId: string
  }
}

export interface IDescreaseGroupPostsCounterMsg {
  type: GroupUpdateTypes.descreasePostsCounter
  data: {
    group: string
    traceId: string
  }
}

export interface IUpdateGroupTagsMsq {
  type: GroupUpdateTypes.updateTags
  data: {
    group: string
    traceId: string
    tags: string[]
  }
}

export type IGroupUpdateMsg =
  | IIncreaseGroupPostsCounterMsg
  | IDescreaseGroupPostsCounterMsg
  | IUpdateGroupTagsMsq
