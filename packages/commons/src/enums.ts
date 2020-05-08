export enum Queues {
  notifications = 'notifications',
  deleteAccount = 'deleteAccount',
  updateESIndex = 'updateESIndex',
  deleteGroup = 'deleteGroup',
  createFile = 'createFile',
  updateGroupFiles = 'updateGroupFiles',
  updateUserFiles = 'updateUserFiles',
  userUpdate = 'userUpdate',
  updateTags = 'updateTags',
}

export enum NotificationQueueMessageType {
  email = 'email',
  webPush = 'webPush',
}

export enum ESIndexUpdateType {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum ESIndexUpdateRecord {
  user = 'user',
  group = 'group',
  post = 'post',
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

export enum UserUpdateTypes {
  joinedGroup = 'joinedGroup',
  leftGroup = 'leftGroup',
  createdGroup = 'createdGroup',
  deletedGroup = 'deletedGroup',
  gotGroupAdminRights = 'gotGroupAdminRights',
  lostGroupAdminRights = 'lostGroupAdminRights',
}

export enum Indicies {
  GROUPS_INDEX = 'groups',
}

export enum RecordType {
  member = 'member',
  group = 'group',
  post = 'post',
}
