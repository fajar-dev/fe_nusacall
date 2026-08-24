export interface User {
  username: string
  displayName: string | null
  role: string | null
  canReceiveCalls: boolean
}

export interface AuthData {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: User
}

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type AuthResponse = ApiResponse<AuthData>
