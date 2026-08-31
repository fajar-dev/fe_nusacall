import type { UserAvailability } from '~/enums/user-availability'

export type { UserAvailability }

export interface UserSummary {
  id: number
  name: string
  email: string
  photo: string | null
  organization: {
    id: number
    name: string
  } | null
}

export interface User {
  id: number
  employeeId: number
  name: string
  photo: string | null
  email: string
  isActive: boolean
  organization?: {
    id: number
    name: string
  } | null
  branch?: {
    id: number
    name: string
    code: string
  } | null
  availability: UserAvailability
  currentCallId: number | null
}
