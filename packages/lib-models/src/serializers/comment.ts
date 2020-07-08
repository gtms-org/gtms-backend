import { IComment } from '../models/comments'
import { ISerializedComment, ISerializedUser } from '@gtms/commons'

export function serializeComment(
  comment: IComment,
  owners?: { [id: string]: ISerializedUser }
): ISerializedComment {
  return {
    id: comment._id,
    text: comment.text,
    subComments: (comment.subComments || []).map(subComment => ({
      ...subComment,
      owner: (owners !== undefined && owners[`${comment.owner}`]
        ? owners[`${comment.owner}`]
        : subComment.owner) as ISerializedUser,
    })),
    tags: comment.tags,
    owner:
      owners !== undefined && owners[`${comment.owner}`]
        ? owners[`${comment.owner}`]
        : comment.owner,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}
