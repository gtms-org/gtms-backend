import { FileStatus } from '../../enums'

export interface ISerializedGroupTag {
  id: string
  tag: string
  description: string
  order: number
  logo: {
    status: FileStatus
    files: string[]
  }
}
