import { IGroup } from '../models/groups'
import { ISerializedGroup } from '@gtms/commons'

export function serializeGroup(group: IGroup): ISerializedGroup {
  return {
    id: group._id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    type: group.type,
    visibility: group.visibility,
    avatar: group.avatar,
    tags: group.tags,
    owner: group.owner,
  }
}
