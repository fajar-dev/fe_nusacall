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
}

interface AuthData {
  user: User
  accessToken: string
  refreshToken: string
}

export type AuthResponse = ApiResponse<AuthData>

export interface NusaworkProfile {
  firstName: string
  lastName: string
  email: string
  photo: string
  company?: { name: string, address: string }
}

export interface NusaworkQrCode {
  token: string
  qrCode: string
  timeoutMinutes: number
  expired: string
}

export interface NusaworkQrStatus {
  status: 'waiting' | 'confirmation' | 'success'
  panelToken?: string
  profile?: NusaworkProfile
  message?: string
}
