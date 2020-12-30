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
    html: postObj.html,
    oembeds: postObj.oembeds,
    group: postObj.group,
    tags: postObj.tags,
    lastTags: postObj.lastTags || [],
    owner: postObj.owner,
    favs: postObj.favs || [],
    images: postObj.images || [],
    commentsCounter: postObj.commentsCounter,
    firstComments: postObj.firstComments || [],
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt,
  }
}

export function addUserToSerializePost(
  post: ISerializedPost,
  members: { [id: string]: ISerializedUser }
) {
  if (members[post.owner as string]) {
    post.owner = members[post.owner as string]
  }

  if (Array.isArray(post.firstComments)) {
    post.firstComments = post.firstComments.map(
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

  return post
}

export function serializePostWithUser(
  post: IPost,
  members: { [id: string]: ISerializedUser }
) {
  return addUserToSerializePost(serializePost(post), members)
}
