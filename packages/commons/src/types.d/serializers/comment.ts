import { ISerializedUser } from './user'

export interface ISerializedComment {
  id: string
  text: string
  html: string
  subComments: {
    owner: ISerializedUser | string
    createdAt: string
    updatedAt: string
    text: string
    html: string
    tags: string[]
    lastTags: string[]
  }[]
  tags: string[]
  lastTags: string[]
  owner: ISerializedUser | string
  createdAt: string
  updatedAt: string
}
