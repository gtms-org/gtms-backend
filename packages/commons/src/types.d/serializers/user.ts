export interface ISerializedUser {
  id: string
  name?: string
  surname?: string
  email: string
  phone?: string
  countryCode: string
  languageCode: string
  tags: string[]
  roles: string[]
}
