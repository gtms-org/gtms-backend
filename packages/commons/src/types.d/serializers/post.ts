import { ISerializedComment } from './comment'

export interface ISerializedPost {
  id: string
  text: string
  tags: string[]
  owner: string
  commentsCounter: number
  firstComments: ISerializedComment[]
  createdAt: string
  updatedAt: string
}
