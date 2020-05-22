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

export type IGroupUpdateMsg =
  | IIncreaseGroupPostsCounterMsg
  | IDescreaseGroupPostsCounterMsg
