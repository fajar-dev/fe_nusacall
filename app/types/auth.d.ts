import type { ApiResponse } from './api'

export interface User {
  id: number
  employeeId: string
  name: string
  photo: string | null
  email: string
  isActive: boolean
  organization?: {
    id: number
    name: string
  } | null
  role: string
}

interface AuthData {
  user: User
  accessToken: string
  refreshToken: string
}

export type AuthResponse = ApiResponse<AuthData>
