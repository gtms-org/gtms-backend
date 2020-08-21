import { IComment } from '../models/comments'
import { ISerializedComment, ISerializedUser, IOEmbed } from '@gtms/commons'

export function serializeComment(
  comment:
    | IComment
    | {
        _id: string
        subComments: any
        text: string
        html: string
        oembeds?: IOEmbed[]
        tags: string[]
        lastTags: string[]
        owner: string
        createdAt: string
        updatedAt: string
      },
  owners?: { [id: string]: ISerializedUser }
): ISerializedComment {
  return {
    id: comment._id,
    text: comment.text,
    html: comment.html,
    oembeds: comment.oembeds,
    subComments: (comment.subComments || []).map((subComment: any) => ({
      id: `${subComment._id}`,
      text: subComment.text,
      html: subComment.html,
      oembeds: subComment.oembeds,
      tags: subComment.tags || [],
      lastTags: subComment.lastTags || [],
      createdAt: subComment.createdAt,
      updatedAt: subComment.updatedAt,
      owner: (owners !== undefined && owners[`${comment.owner}`]
        ? owners[`${comment.owner}`]
        : subComment.owner) as ISerializedUser,
    })),
    tags: comment.tags,
    lastTags: comment.lastTags || [],
    owner:
      owners !== undefined && owners[`${comment.owner}`]
        ? owners[`${comment.owner}`]
        : comment.owner,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}
