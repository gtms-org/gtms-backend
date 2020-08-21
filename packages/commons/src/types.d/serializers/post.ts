import { ISerializedComment } from './comment'
import { ISerializedUser } from './user'
import { IOEmbed } from '../oembed'

export interface ISerializedPost {
  id: string
  text: string
  html: string
  oembeds?: IOEmbed[]
  tags: string[]
  lastTags: string[]
  owner: string | ISerializedUser
  favs: string[]
  commentsCounter: number
  firstComments: ISerializedComment[]
  createdAt: string
  updatedAt: string
}
