export interface ISerializedComment {
  id: string
  text: string
  lastSubComments: {
    owner: string
    createdAt: string
    updatedAt: string
    text: string
  }[]
  tags: string[]
  owner: string
  createdAt: string
  updatedAt: string
}
