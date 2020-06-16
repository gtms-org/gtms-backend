import { ESIndexUpdateType, ESIndexUpdateRecord } from '../../enums'
import { ISerializedPost } from '../serializers/post'

export interface IESPostCreateMsg {
  type: ESIndexUpdateType.create
  record: ESIndexUpdateRecord.post
  data: ISerializedPost & { traceId: string }
}

export interface IESPostUpdateMsg {
  type: ESIndexUpdateType.update
  record: ESIndexUpdateRecord.post
  data: ISerializedPost & { traceId: string }
}

export interface IESPostDeleteMsg {
  type: ESIndexUpdateType.delete
  record: ESIndexUpdateRecord.post
  data: {
    id: string
    traceId: string
  }
}

export type IESPostMsg = IESPostCreateMsg | IESPostUpdateMsg | IESPostDeleteMsg
