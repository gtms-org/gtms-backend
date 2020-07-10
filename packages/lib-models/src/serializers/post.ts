import { IPost } from '../models/posts'
import {
  ISerializedPost,
  ISerializedUser,
  ISerializedComment,
} from '@gtms/commons'

export function serializePost(post: IPost): ISerializedPost {
  const postObj = post.toObject()

  return {
    id: postObj._id,
    text: postObj.text,
    tags: postObj.tags,
    lastTags: postObj.lastTags || [],
    owner: postObj.owner,
    commentsCounter: postObj.commentsCounter,
    firstComments: postObj.firstComments || [],
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt,
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
          return {
            ...comment,
            owner: members[`${comment.owner}`],
          }
        }

        return comment
      }
    )
  }

  return result
}
