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
