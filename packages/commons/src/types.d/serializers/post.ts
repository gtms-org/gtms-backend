import { ISerializedComment } from './comment'
import { ISerializedUser } from './user'
import { ISerializedGroup } from './group'
import { IOEmbed } from '../oembed'
import { FileStatus } from '../../enums'

export interface ISerializedPost {
  id: string
  text: string
  html: string
  oembeds?: IOEmbed[]
  group: string | ISerializedGroup
  tags: string[]
  lastTags: string[]
  owner: string | ISerializedUser
  favs: string[]
  commentsCounter: number
  firstComments: ISerializedComment[]
  images?: {
    status: FileStatus
    files: string[]
  }[]
  createdAt: string
  updatedAt: string
}
