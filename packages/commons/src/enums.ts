export enum Queues {
  notifications = 'notifications',
  deleteAccount = 'deleteAccount',
  createUpdateGroup = 'createUpdateGroup',
  deleteGroup = 'deleteGroup',
  createFile = 'createFile',
  updateGroupFiles = 'updateGroupFiles',
  updateUserFiles = 'updateUserFiles',
}

export enum NotificationQueueMessageType {
  email = 'email',
  webPush = 'webPush',
}

export enum CreateUpdateGroupQueueMessageType {
  create = 'create',
  update = 'update',
}

export enum http {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum FileTypes {
  avatar = 'avatar',
  groupLogo = 'groupLogo',
  groupBg = 'groupBg',
  userGallery = 'userGallery',
}

export enum FileStatus {
  new = 'new',
  uploaded = 'uploaded',
  processing = 'processing',
  ready = 'ready',
}
