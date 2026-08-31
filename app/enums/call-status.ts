export const CALL_STATUSES = [
  'pending',
  'ringing',
  'connecting',
  'active',
  'completed',
  'missed',
  'rejected',
  'failed',
  'abandoned'
] as const

export type CallStatus = typeof CALL_STATUSES[number]

export const TERMINAL_CALL_STATUSES: readonly CallStatus[] = [
  'completed',
  'missed',
  'rejected',
  'failed',
  'abandoned'
]
