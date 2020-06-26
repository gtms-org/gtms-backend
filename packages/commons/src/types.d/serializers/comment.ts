import { ISerializedUser } from './user'

export interface ISerializedComment {
  id: string
  text: string
  lastSubComments: {
    owner: string | ISerializedUser
    createdAt: string
    updatedAt: string
    text: string
  }[]
  tags: string[]
  owner: ISerializedUser | string
  createdAt: string
  updatedAt: string
}
