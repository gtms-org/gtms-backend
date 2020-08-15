import { FileStatus } from '../../enums'
import { BGTypes } from '../groupBgTypes'
import { CoverTypes } from '../groupCoverTypes'

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
  bgType: BGTypes
  cover?: {
    status: FileStatus
    files: string[]
  }
  coverType: CoverTypes
  tags?: string[]
  owner: string
  postsCounter: number
  membersCounter: number
}
