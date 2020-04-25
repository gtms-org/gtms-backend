import { UserUpdateTypes } from '../enums'

export interface IUserJoinedGroupMsg {
  type: UserUpdateTypes.joinedGroup
  data: {
    id: string
    traceId: string
  }
}

export interface IUserLeftGroupMsg {
  type: UserUpdateTypes.leftGroup
  data: {
    id: string
    traceId: string
  }
}

export interface IUserGotGroupAdminRights {
  type: UserUpdateTypes.gotGroupAdminRights
  data: {
    id: string
    traceId: string
  }
}

export interface IUserLostGroupAdminRights {
  type: UserUpdateTypes.lostGroupAdminRights
  data: {
    id: string
    traceId: string
  }
}

export type IUserUpdateMsg =
  | IUserJoinedGroupMsg
  | IUserLeftGroupMsg
  | IUserGotGroupAdminRights
  | IUserLostGroupAdminRights
