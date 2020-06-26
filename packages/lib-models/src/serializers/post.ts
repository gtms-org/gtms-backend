import { IPost } from '../models/posts'
import {
  ISerializedPost,
  ISerializedUser,
  ISerializedComment,
} from '@gtms/commons'

export function serializePost(post: IPost): ISerializedPost {
  return {
    id: post._id,
    text: post.text,
    tags: post.tags,
    owner: post.owner,
    commentsCounter: post.commentsCounter,
    firstComments: post.firstComments || [],
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

export function serializePostWithUser(
  post: IPost,
  members: { [id: string]: ISerializedUser }
) {
  const result: ISerializedPost = serializePost(post)

  if (members[post.owner]) {
    result.owner = members[post.owner]
  }

  if (Array.isArray(result.firstComments)) {
    result.firstComments = result.firstComments.map(
      (comment: ISerializedComment) => {
        if (members[`${comment.owner}`]) {
          comment.owner = members[`${comment.owner}`]
        }

        return comment
      }
    )
  }

  return result
}
