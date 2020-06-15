import { ESIndexUpdateType, ESIndexUpdateRecord } from '../../enums'
import { ISerializedComment } from '../serializers/comment'

export interface IESCommentCreateMsg {
  type: ESIndexUpdateType.create
  record: ESIndexUpdateRecord.comment
  data: ISerializedComment & { traceId: string }
}

export interface IESCommentUpdateMsg {
  type: ESIndexUpdateType.update
  record: ESIndexUpdateRecord.comment
  data: ISerializedComment & { traceId: string }
}

export interface IESCommentDeleteMsg {
  type: ESIndexUpdateType.delete
  record: ESIndexUpdateRecord.comment
  data: {
    id: string
    traceId: string
  }
}

export type IESCommentMsg =
  | IESCommentCreateMsg
  | IESCommentUpdateMsg
  | IESCommentDeleteMsg
