import type { CallStatus } from '~/enums/call-status'
import type { CallDirection } from '~/enums/call-direction'
import type { UserSummary } from './user'
import type { Contact } from './contact'

export interface Call {
  id: number
  wacid: string
  phoneNumberId: string
  contact: Contact | null
  user: UserSummary | null
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
  createdAt: string
}

export interface RecordingTracks {
  url: string
  durationSeconds: number
}

export type RecordingAvailability
  = | { state: 'not_ready' }
    | ({ state: 'ready' } & RecordingTracks)

export interface CallStats {
  total: number
  answered: number
  missed: number
  rejected: number
  failed: number
  inbound: number
  outbound: number
  avgDurationSeconds: number | null
  avgSetupMs: number | null
  answerRate: number | null
}

export type { CallStatus, CallDirection }
