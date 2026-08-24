export type CallStatus
  = | 'pending' | 'ringing' | 'connecting' | 'active'
    | 'completed' | 'missed' | 'rejected' | 'failed' | 'abandoned'

export type CallDirection = 'inbound' | 'outbound'

export interface Call {
  id: number
  wacid: string
  phoneNumberId: string
  displayPhoneNumber: string | null
  waId: string
  profileName: string | null
  contactName: string | null
  inboxId: string | null
  agentUsername: string | null
  direction: CallDirection
  status: CallStatus
  endReason: string | null
  errorCode: number | null
  errorMessage: string | null
  ringingAt: string | null
  answeredAt: string | null
  endedAt: string | null
  durationSeconds: number | null
  setupDurationMs: number | null
  recordingEnabled: boolean
  transcriptionEnabled: boolean
  createdAt: string
}

export interface CallStats {
  total: number
  answered: number
  missed: number
  rejected: number
  failed: number
  avgDurationSeconds: number | null
  avgSetupMs: number | null
  answerRate: number | null
}
