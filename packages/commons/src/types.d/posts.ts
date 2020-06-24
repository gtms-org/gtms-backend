import { ISerializedComment } from './serializers'

export interface INewPostCommentMsg {
  post: string
  data: {
    comment: ISerializedComment
    traceId: string
    parentComment?: string
  }
}
