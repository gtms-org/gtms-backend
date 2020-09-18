export interface ISerializedAbuseReport {
  group: string
  post?: string
  comment?: string
  text: string
  html: string
  owner: string
  reporter: string
  moderator?: string
  reason: string
  substantiation: string
  status: string
  confirmationDecision?: string
  createdAt: string
  updatedAt: string
}
