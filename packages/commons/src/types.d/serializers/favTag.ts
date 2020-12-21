import { ISerializedGroupTag } from './groupTag'

export interface ISerializedFavTag {
  id: string
  type: string
  group: string
  createdAt: string
  updatedAt: string
  groupTag?: ISerializedGroupTag
  tag?: string
}
