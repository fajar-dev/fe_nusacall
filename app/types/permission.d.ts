export type PermissionStatus = 'no_permission' | 'temporary' | 'permanent'

export interface PermissionQuotaLimit {
  time_period: string
  max_allowed: number
  current_usage: number
  limit_expiration_time?: number
}

export interface PermissionQuotaAction {
  action_name: 'send_call_permission_request' | 'start_call'
  can_perform_action: boolean
  limits: PermissionQuotaLimit[]
}

export interface PermissionCheckResult {
  status: PermissionStatus
  expiresAt: string | null
  lastRequestedAt: string | null
  quota: PermissionQuotaAction[] | null
}
