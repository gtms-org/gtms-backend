import { IGroup } from '../models/groups'
import { ISerializedGroup, BGTypes, CoverTypes } from '@gtms/commons'

export function serializeGroup(group: IGroup): ISerializedGroup {
  return {
    id: group._id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    type: group.type,
    visibility: group.visibility,
    avatar: group.avatar,
    bg: group.bg,
    bgType: group.bgType || BGTypes.background1,
    cover: group.cover,
    coverType: group.coverType || CoverTypes.unknown,
    tags: group.tags,
    owner: group.owner,
    postsCounter: group.postsCounter,
    membersCounter: group.membersCounter,
  }
}
