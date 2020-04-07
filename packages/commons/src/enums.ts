export enum Queues {
  notifications = 'notifications',
  deleteAccount = 'deleteAccount',
  createUpdateGroup = 'createUpdateGroup',
  deleteGroup = 'deleteGroup',
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
