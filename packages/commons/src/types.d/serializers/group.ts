import { FileStatus } from '../../enums'

export interface ISerializedGroup {
  id: string
  name: string
  slug: string
  description?: string
  type: 'public' | 'private'
  visibility: 'public' | 'private'
  avatar?: {
    status: FileStatus
    files: string[]
  }
  bg?: {
    status: FileStatus
    files: string[]
  }
  bgType: any
  tags?: string[]
  owner: string
  postsCounter: number
  membersCounter: number
}
