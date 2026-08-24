export type AgentAvailability = 'available' | 'busy' | 'away' | 'offline'

export interface Agent {
  username: string
  displayName: string | null
  role: string | null
  canReceiveCalls: boolean
  availability: AgentAvailability
  currentCallId: number | null
  totalCallsHandled: number
  lastSeenAt: string | null
}

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  from: number
  to: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode?: number
  message?: string
  data: T
  meta?: PaginationMeta
}
