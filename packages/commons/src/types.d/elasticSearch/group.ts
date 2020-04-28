import { ESIndexUpdateType, ESIndexUpdateRecord } from '../../enums'
import { ISerializedGroup } from '../serializers/group'

export interface IESGroupCreateMsg {
  type: ESIndexUpdateType.create
  record: ESIndexUpdateRecord.group
  data: ISerializedGroup & { traceId: string }
}

export interface IESGroupUpdateMsg {
  type: ESIndexUpdateType.update
  record: ESIndexUpdateRecord.group
  data: ISerializedGroup & { traceId: string }
}

export interface IESGroupDeleteMsg {
  type: ESIndexUpdateType.delete
  record: ESIndexUpdateRecord.group
  data: {
    id: string
    traceId: string
  }
}

export type IESGroupMsg =
  | IESGroupCreateMsg
  | IESGroupUpdateMsg
  | IESGroupDeleteMsg
