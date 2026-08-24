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

/** Meta's transcript document shape — docs: calling/call-transcription. */
export interface TranscriptDocument {
  metadata?: {
    duration?: number
    sample_rate?: number
    channels?: number
    processed_at?: string
  }
  transcript: {
    text: string
    language: string
    confidence: number
    segments: TranscriptSegment[]
  }
}

export interface TranscriptSegment {
  speaker: 'Business' | 'Customer'
  channel: 0 | 1
  start: number
  end: number
  words?: Array<{ word: string, start: number, end: number, confidence: number }>
}

/** Discriminated result so the UI can render each state without triggering an error toast for expected ones (not recorded / still processing). */
export type ArtifactAvailability
  = | { state: 'not_ready' }
    | { state: 'expired' }
    | { state: 'ready', url: string }

export type TranscriptAvailability
  = | { state: 'not_ready' }
    | { state: 'expired' }
    | { state: 'ready', content: TranscriptDocument }

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
