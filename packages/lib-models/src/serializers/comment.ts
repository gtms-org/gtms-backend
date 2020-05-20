import { IComment } from '../models/comments'
import { ISerializedComment } from '@gtms/commons'

export function serializeComment(comment: IComment): ISerializedComment {
  return {
    id: comment._id,
    text: comment.text,
    lastSubComments: comment.lastSubComments,
    tags: comment.tags,
    owner: comment.owner,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}
