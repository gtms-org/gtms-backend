import { ESIndexUpdateType, ESIndexUpdateRecord } from '../../enums'
import { ISerializedUser } from '../serializers/user'

export interface IESUserCreateMsg {
  type: ESIndexUpdateType.create
  record: ESIndexUpdateRecord.user
  data: ISerializedUser & { traceId: string }
}

export interface IESUserUpdateMsg {
  type: ESIndexUpdateType.update
  record: ESIndexUpdateRecord.user
  data: ISerializedUser & { traceId: string }
}

export interface IESUserDeleteMsg {
  type: ESIndexUpdateType.delete
  record: ESIndexUpdateRecord.user
  data: {
    id: string
    traceId: string
  }
}

export type IESUserMsg = IESUserCreateMsg | IESUserUpdateMsg | IESUserDeleteMsg
