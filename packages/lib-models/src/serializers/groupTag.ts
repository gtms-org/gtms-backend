import { IGroupTag } from '../models/groupTags'
import { ITag } from '../models/tags'
import { ISerializedGroupTag } from '@gtms/commons'

export function serializeGroupTag(groupTag: IGroupTag): ISerializedGroupTag {
  return {
    id: groupTag._id,
    tag: (groupTag.tag as ITag).name,
    description: groupTag.description,
    order: groupTag.order,
    logo: groupTag.logo,
  }
}
