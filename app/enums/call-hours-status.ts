export const CALL_HOURS_STATUSES = ['ENABLED', 'DISABLED'] as const

export type CallHoursStatus = typeof CALL_HOURS_STATUSES[number]
