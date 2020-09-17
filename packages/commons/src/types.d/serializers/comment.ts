import { ISerializedUser } from './user'
import { IOEmbed } from '../oembed'

export interface ISerializedComment {
  id: string
  post: string
  text: string
  html: string
  oembeds?: IOEmbed[]
  subComments: {
    owner: ISerializedUser | string
    createdAt: string
    updatedAt: string
    text: string
    html: string
    oembeds?: IOEmbed[]
    tags: string[]
    lastTags: string[]
  }[]
  tags: string[]
  lastTags: string[]
  owner: ISerializedUser | string
  createdAt: string
  updatedAt: string
}
