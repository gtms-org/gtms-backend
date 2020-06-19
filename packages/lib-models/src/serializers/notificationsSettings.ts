import { INotificationsSettings } from '../models/notificationsSettings'
import { ISerializedNotificationsSettings } from '@gtms/commons'

export function serializeNotificationsSettings(
  notificationsSettings: INotificationsSettings
): ISerializedNotificationsSettings {
  return {
    invitation: notificationsSettings.invitation,
    newPostInOwnedGroup: notificationsSettings.newPostInOwnedGroup,
    newMembershipRequestInOwnedGroup:
      notificationsSettings.newMembershipRequestInOwnedGroup,
    newMemberInOwnedGroup: notificationsSettings.newMemberInOwnedGroup,
    newPostInAdminnedGroup: notificationsSettings.newPostInAdminnedGroup,
    newMembershipRequestInAdminnedGroup:
      notificationsSettings.newMembershipRequestInAdminnedGroup,
    newMemberInAdminnedGroup: notificationsSettings.newMemberInAdminnedGroup,
  }
}
