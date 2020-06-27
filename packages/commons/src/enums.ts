export enum Queues {
  // notifications = 'notifications',
  sendEmail = 'sendEmail',
  deleteAccount = 'deleteAccount',
  updateESIndex = 'updateESIndex',
  deleteGroup = 'deleteGroup',
  createFile = 'createFile',
  updateGroupFiles = 'updateGroupFiles',
  updateUserFiles = 'updateUserFiles',
  userUpdate = 'userUpdate',
  groupUpdate = 'groupUpdate',
  updateTags = 'updateTags',
  updateGroupTagFiles = 'updateGroupTagFiles',
  newComment = 'newComment',
  newNotification = 'newNotification',
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
  comment = 'comment',
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
  groupTagLogo = 'groupTagLogo',
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
  increasePostsCounter = 'increasePostsCounter',
  descreasePostsCounter = 'descreasePostsCounter',
}

export enum GroupUpdateTypes {
  increasePostsCounter = 'increasePostsCounter',
  descreasePostsCounter = 'descreasePostsCounter',
}

export enum Indicies {
  GROUPS_INDEX = 'groups',
  USERS_INDEX = 'users',
  POSTS_INDEX = 'posts',
  COMMENTS_INDEX = 'comments',
}

export enum RecordType {
  member = 'member',
  group = 'group',
  post = 'post',
  comment = 'comment',
}

export enum NotificationType {
  newGroupInvitation = 'newGroupInvitation',
  newPost = 'newPost',
  newMembershipRequest = 'newMembershipRequest',
  newGroupMember = 'newGroupMember',
  newComment = 'newComment',
  newAnswerToComment = 'newAnswerToComment',
}
