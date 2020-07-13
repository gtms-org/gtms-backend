import { ISerializedComment } from './comment'
import { ISerializedUser } from './user'

export interface ISerializedPost {
  id: string
  text: string
  tags: string[]
  lastTags: string[]
  owner: string | ISerializedUser
  favs: number
  commentsCounter: number
  firstComments: ISerializedComment[]
  createdAt: string
  updatedAt: string
}
