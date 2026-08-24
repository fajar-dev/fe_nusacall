export interface Contact {
  phoneNumber: string
  name: string | null
  groups: string | null
  timezone: string | null
  branchCode: string | null
  ownedByPhoneNumber: string
  isGroup: boolean
  createdAt: string
  updatedAt: string
}
