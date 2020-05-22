import { UserUpdateTypes } from '../enums'

export interface IUserJoinedGroupMsg {
  type: UserUpdateTypes.joinedGroup
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IUserLeftGroupMsg {
  type: UserUpdateTypes.leftGroup
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IUserCreatedGroupMsg {
  type: UserUpdateTypes.createdGroup
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IUserDeletedGroupMsg {
  type: UserUpdateTypes.deletedGroup
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IUserGotGroupAdminRights {
  type: UserUpdateTypes.gotGroupAdminRights
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IUserLostGroupAdminRights {
  type: UserUpdateTypes.lostGroupAdminRights
  data: {
    group: string
    user: string
    traceId: string
  }
}

export interface IIncreaseUserPostsCounterMsg {
  type: UserUpdateTypes.increasePostsCounter
  data: {
    user: string
    traceId: string
  }
}

export interface IDescreaseUserPostsCounterMsg {
  type: UserUpdateTypes.descreasePostsCounter
  data: {
    user: string
    traceId: string
  }
}

export type IUserUpdateMsg =
  | IUserJoinedGroupMsg
  | IUserLeftGroupMsg
  | IUserGotGroupAdminRights
  | IUserLostGroupAdminRights
  | IUserCreatedGroupMsg
  | IUserDeletedGroupMsg
  | IIncreaseUserPostsCounterMsg
  | IDescreaseUserPostsCounterMsg
