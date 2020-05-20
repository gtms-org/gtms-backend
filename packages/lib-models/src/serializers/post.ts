import { IPost } from '../models/posts'
import { ISerializedPost } from '@gtms/commons'

export function serializePost(post: IPost): ISerializedPost {
  return {
    id: post._id,
    text: post.text,
    tags: post.tags,
    owner: post.owner,
    commentsCounter: post.commentsCounter,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}
