export type UserAvailability = 'available' | 'offline'

/** Lean user shape embedded in other resources (e.g. Call.user). */
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
  role: string
  /** Live presence, merged in on every response that serializes a User — "offline" if not currently connected via WebSocket. */
  availability: UserAvailability
  currentCallId: number | null
}
