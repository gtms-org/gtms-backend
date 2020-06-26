import { IPost } from '../models/posts'
import { ISerializedPost } from '@gtms/commons'
import { ISerializedUser } from '@gtms/commons'

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
  const result: any = serializePost(post)

  if (members[post.owner]) {
    result.owner = members[post.owner]
  }

  if (Array.isArray(result.firstComments)) {
    for (const comment of result.firstComments) {
      if (members[`${comment.owner}`]) {
        comment.owner = members[`${comment.owner}`]
      }
    }
  }

  return result
}
