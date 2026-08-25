export type UserAvailability = 'available' | 'offline'

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
