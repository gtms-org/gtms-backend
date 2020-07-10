import { ISerializedUser } from './user'

export interface ISerializedComment {
  id: string
  text: string
  subComments: {
    owner: ISerializedUser | string
    createdAt: string
    updatedAt: string
    text: string
    tags: string[]
    lastTags: string[]
  }[]
  tags: string[]
  lastTags: string[]
  owner: ISerializedUser | string
  createdAt: string
  updatedAt: string
}
