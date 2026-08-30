export const PERMISSION_STATUSES = ['no_permission', 'temporary', 'permanent'] as const

export type PermissionStatus = typeof PERMISSION_STATUSES[number]
