import { FileTypes, Queues } from './enums'

export const FILES_QUEUE_MAPPER: {
  [key: string]: string
} = {
  [FileTypes.groupLogo]: Queues.updateGroupFiles,
  [FileTypes.groupBg]: Queues.updateGroupFiles,
  [FileTypes.avatar]: Queues.updateUserFiles,
  [FileTypes.userGallery]: Queues.updateUserFiles,
  [FileTypes.groupTagLogo]: Queues.updateGroupTagFiles,
}
