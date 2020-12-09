import { IRecentlyViewedTag } from '../models/recentlyViewedTags'
import { ISerializedRecentlyViewedTag } from '@gtms/commons'

export function serializeRecentlyViewedTag(
  tag: IRecentlyViewedTag
): ISerializedRecentlyViewedTag {
  return {
    tag: tag.tag.name,
    createdAt: tag.createdAt,
  }
}
