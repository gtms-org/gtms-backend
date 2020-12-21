import { IFavTag, FavTagType } from '../models/favTags'
import { ISerializedFavTag } from '@gtms/commons'
import { serializeGroupTag } from './groupTag'

export function serializeFavTag(favTag: IFavTag): ISerializedFavTag {
  switch (favTag.type) {
    case FavTagType.groupTag:
      return {
        type: FavTagType.groupTag,
        id: favTag._id,
        group: favTag.group,
        createdAt: favTag.createdAt,
        updatedAt: favTag.updatedAt,
        groupTag: serializeGroupTag(favTag.groupTag),
      }

    case FavTagType.tag:
      return {
        type: FavTagType.tag,
        id: favTag._id,
        group: favTag.group,
        createdAt: favTag.createdAt,
        updatedAt: favTag.updatedAt,
        tag: favTag.tag.name,
      }
  }
}
